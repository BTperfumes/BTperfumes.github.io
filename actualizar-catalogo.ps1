<#
=========================================================
  ACTUALIZAR CATÁLOGO
  ---------------------------------------------------------
  Convierte la lista del proveedor (Excel .xls / .xlsx) en:
    - data/catalogo.json  -> datos limpios (formato estándar)
    - data/catalogo.js    -> los mismos datos, para que la web
                             funcione abriendo index.html con doble clic

  Uso:
    1) Copiá el Excel nuevo en la carpeta "proveedor".
    2) Doble clic en "actualizar-catalogo.bat"
       (o en PowerShell: .\actualizar-catalogo.ps1)
    Se usa el Excel más reciente de la carpeta "proveedor".
    También se puede indicar uno puntual:
       .\actualizar-catalogo.ps1 -Archivo "C:\ruta\lista.xls"

  Requisito: Microsoft Excel instalado (se lee el archivo a través de Excel).

  IMPORTANTE: los números de las columnas de tamaño son PRECIOS.
  Solo se usan para saber qué tamaños existen; nunca se escriben.
=========================================================
#>
param(
  [string]$Archivo
)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot

# ---------------------------------------------------------
# CONFIGURACIÓN (editable)
# ---------------------------------------------------------

# Abreviaturas de marca -> nombre completo.
# La comparación ignora espacios y mayúsculas ("J.P. GAULTIER" = "J. P. GAULTIER").
$ABREVIATURAS_MARCA = @{
  'C. HERRERA'     = 'Carolina Herrera'
  'A. BANDERAS'    = 'Antonio Banderas'
  'N. RODRIGUEZ'   = 'Narciso Rodriguez'
  'P. RABANNE'     = 'Paco Rabanne'
  'J. P. GAULTIER' = 'Jean Paul Gaultier'
  'DOLCE GABBANA'  = 'Dolce & Gabbana'
  'A. DOMINGUEZ'   = 'Adolfo Dominguez'
  'A. R. PRADA'    = 'Agatha Ruiz De La Prada'
}

# Siglas que se mantienen en mayúsculas al pasar a formato "Título"
$SIGLAS = @('EDT', 'EDP', 'YSL', 'CK', 'NR', 'DKNY', 'XS', 'VIP', 'CH', 'H24', 'ADN')

# Concentraciones / variantes que se extraen como "fragancia".
# Las frases van antes que las palabras sueltas (ej: "LE PARFUM" antes que "PARFUM").
$FRAGANCIAS = @(
  'PARFUM DE EAU', 'LE PARFUM', 'PURE PARFUM',
  'EDT', 'EDP', 'PARFUM', 'ELIXIR', 'INTENSE',
  'ABSOLUTE', 'ABSOLUE', 'ABSOLU', 'EXTREME', 'COLOGNE', 'ESSENCE'
)

# Hoja del Excel -> género
function Obtener-Genero([string]$hoja) {
  $h = $hoja.ToUpper()
  if ($h -match 'HOMBRE') { return 'Hombre' }
  if ($h -match 'MUJER')  { return 'Mujer' }
  if ($h -match 'UNISEX') { return 'Unisex' }
  return $null
}

# ---------------------------------------------------------
# FUNCIONES DE LIMPIEZA
# ---------------------------------------------------------

# Quita espacios sobrantes y dobles, y ordena los espacios alrededor de "/"
# ("BAMBU/ AGUA" -> "BAMBU / AGUA"), sin tocar casos como "24/7".
function Limpiar-Texto($valor) {
  if ($null -eq $valor) { return '' }
  $t = ([string]$valor) -replace '\s+', ' '
  $t = $t.Trim()
  $t = [regex]::Replace($t, '(?<=\p{L})\s*/\s*(?=\p{L})|\s+/\s*|\s*/\s+', ' / ')
  return $t.Trim(' ', '/')
}

# "ACQUA DI GIO" -> "Acqua Di Gio" (respetando siglas y L'/D')
function Convertir-Titulo([string]$t) {
  $t = $t.ToLower()
  # Mayúscula al inicio de cada palabra
  $t = [regex]::Replace($t, '(^|[\s/\-\(])(\p{L})', { param($m) $m.Groups[1].Value + $m.Groups[2].Value.ToUpper() })
  # L'Interdit, D'Issey
  $t = [regex]::Replace($t, "\b([LD]')(\p{L})", { param($m) $m.Groups[1].Value + $m.Groups[2].Value.ToUpper() })
  # Siglas en mayúsculas
  foreach ($s in $SIGLAS) {
    $t = [regex]::Replace($t, "\b$s\b", $s, 'IgnoreCase')
  }
  return $t
}

# Clave para comparar abreviaturas: sin espacios y en mayúsculas
function Clave([string]$t) { return ($t -replace '\s', '').ToUpper() }

$mapaMarcas = @{}
foreach ($k in $ABREVIATURAS_MARCA.Keys) { $mapaMarcas[(Clave $k)] = $ABREVIATURAS_MARCA[$k] }

function Normalizar-Marca([string]$t) {
  $c = Clave $t
  if ($mapaMarcas.ContainsKey($c)) { return $mapaMarcas[$c] }
  return Convertir-Titulo $t
}

# Separa la descripción en { nombre, fragancia }.
# Las filas con "/" agrupan variantes: quedan tal cual y sin fragancia.
$regexFragancia = '\b(' + (($FRAGANCIAS | ForEach-Object { [regex]::Escape($_) }) -join '|') + ')\b'

function Separar-Descripcion([string]$desc) {
  # Si la descripción es una marca abreviada (ej: "DOLCE GABBANA"), se expande
  $c = Clave $desc
  if ($mapaMarcas.ContainsKey($c)) {
    return @{ nombre = $mapaMarcas[$c]; fragancia = '' }
  }

  if ($desc -notmatch '/') {
    $encontradas = [regex]::Matches($desc.ToUpper(), $regexFragancia) | ForEach-Object { $_.Value }
    if ($encontradas) {
      $resto = ([regex]::Replace($desc, $regexFragancia, '', 'IgnoreCase') -replace '\s+', ' ').Trim()
      if ($resto) {
        return @{
          nombre    = Convertir-Titulo $resto
          fragancia = Convertir-Titulo (($encontradas | Select-Object -Unique) -join ' ')
        }
      }
    }
  }
  return @{ nombre = Convertir-Titulo $desc; fragancia = '' }
}

# Escapa un texto para JSON
function Json-Texto([string]$t) {
  $t = $t.Replace('\', '\\').Replace('"', '\"')
  $t = [regex]::Replace($t, '[\x00-\x1F]', { param($m) '\u{0:x4}' -f [int][char]$m.Value })
  return '"' + $t + '"'
}

# ---------------------------------------------------------
# 1) ELEGIR EL EXCEL
# ---------------------------------------------------------
if (-not $Archivo) {
  $carpeta = Join-Path $raiz 'proveedor'
  $ultimo = Get-ChildItem -LiteralPath $carpeta -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -in '.xls', '.xlsx' -and $_.Name -notlike '~$*' } |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $ultimo) { throw "No hay ningún Excel en la carpeta '$carpeta'." }
  $Archivo = $ultimo.FullName
}
$Archivo = (Resolve-Path -LiteralPath $Archivo).Path
Write-Host "Leyendo: $Archivo"

# ---------------------------------------------------------
# 2) LEER LAS HOJAS
# ---------------------------------------------------------
$productos = New-Object System.Collections.Generic.List[object]
$avisos = New-Object System.Collections.Generic.List[string]

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
  $libro = $excel.Workbooks.Open($Archivo, 0, $true)   # solo lectura

  foreach ($hoja in $libro.Worksheets) {
    $genero = Obtener-Genero $hoja.Name
    if (-not $genero) { $avisos.Add("Hoja '$($hoja.Name)' ignorada (no es HOMBRE, MUJER ni UNISEX)."); continue }

    $rango = $hoja.UsedRange
    $v = $rango.Value2
    $filas = $rango.Rows.Count
    $cols = $rango.Columns.Count

    # Buscar la fila de encabezado (la que tiene "MARCA")
    $filaEnc = 0; $colMarca = 0
    for ($i = 1; $i -le [Math]::Min(15, $filas) -and -not $filaEnc; $i++) {
      for ($j = 1; $j -le $cols; $j++) {
        if ((Limpiar-Texto $v[$i, $j]) -eq 'MARCA') { $filaEnc = $i; $colMarca = $j; break }
      }
    }
    if (-not $filaEnc) { $avisos.Add("Hoja '$($hoja.Name)': no se encontró la columna MARCA."); continue }

    # La descripción es la columna siguiente a MARCA (en algunas hojas el título está vacío)
    $colDesc = $colMarca + 1

    # Columnas de tamaño: encabezados tipo "30ML", "100 ML"
    $tamanios = @()
    for ($j = 1; $j -le $cols; $j++) {
      $enc = (Limpiar-Texto $v[$filaEnc, $j]).ToUpper()
      if ($enc -match '^(\d+)\s*ML$') { $tamanios += @{ col = $j; ml = [int]$Matches[1] } }
    }

    $cantidadHoja = 0
    for ($i = $filaEnc + 1; $i -le $filas; $i++) {
      $marca = Limpiar-Texto $v[$i, $colMarca]
      $desc  = Limpiar-Texto $v[$i, $colDesc]
      if (-not $marca -and -not $desc) { continue }               # fila vacía
      if (-not $marca -or -not $desc) {
        $avisos.Add("$($hoja.Name) fila $($rango.Row + $i - 1): falta marca o descripción, se omitió.")
        continue
      }

      # Tamaños con valor (el valor es un precio: solo se usa para saber que existe)
      $ml = @()
      foreach ($t in $tamanios) {
        if ($null -ne $v[$i, $t.col] -and ([string]$v[$i, $t.col]).Trim() -ne '') { $ml += $t.ml }
      }
      if ($ml.Count -eq 0) {
        $avisos.Add("$($hoja.Name) fila $($rango.Row + $i - 1): '$marca - $desc' no tiene tamaños.")
      }

      $partes = Separar-Descripcion $desc
      $productos.Add([pscustomobject]@{
        nombre    = $partes.nombre
        marca     = Normalizar-Marca $marca
        fragancia = $partes.fragancia
        ml        = $ml
        genero    = $genero
      })
      $cantidadHoja++
    }
    Write-Host ("  {0,-8} {1,4} productos" -f $hoja.Name, $cantidadHoja)
  }
  $libro.Close($false)
}
finally {
  $excel.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
}

# ---------------------------------------------------------
# 3) GENERAR JSON (un producto por línea, fácil de revisar)
# ---------------------------------------------------------
$lineas = foreach ($p in $productos) {
  '  {' +
    '"nombre": '    + (Json-Texto $p.nombre)    + ', ' +
    '"marca": '     + (Json-Texto $p.marca)     + ', ' +
    '"fragancia": ' + (Json-Texto $p.fragancia) + ', ' +
    '"ml": ['       + ($p.ml -join ', ')        + '], ' +
    '"genero": '    + (Json-Texto $p.genero)    +
  '}'
}
$json = "[`n" + ($lineas -join ",`n") + "`n]`n"

$utf8 = New-Object System.Text.UTF8Encoding($false)
$carpetaDatos = Join-Path $raiz 'data'
[IO.File]::WriteAllText((Join-Path $carpetaDatos 'catalogo.json'), $json, $utf8)

$js = "/* ARCHIVO GENERADO AUTOMÁTICAMENTE por actualizar-catalogo.ps1 - no editar a mano.`n" +
      "   Origen: $(Split-Path $Archivo -Leaf)  |  $(Get-Date -Format 'dd/MM/yyyy HH:mm') */`n" +
      "const CATALOGO = " + $json.TrimEnd() + ";`n"
[IO.File]::WriteAllText((Join-Path $carpetaDatos 'catalogo.js'), $js, $utf8)

# ---------------------------------------------------------
# 4) RESUMEN
# ---------------------------------------------------------
$marcas = ($productos | Select-Object -ExpandProperty marca -Unique).Count
Write-Host ""
Write-Host "Listo: $($productos.Count) productos, $marcas marcas." -ForegroundColor Green
Write-Host "Generados: data\catalogo.json y data\catalogo.js"
if ($avisos.Count) {
  Write-Host ""
  Write-Host "Avisos:" -ForegroundColor Yellow
  $avisos | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}
