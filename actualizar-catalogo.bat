@echo off
REM Doble clic para regenerar el catalogo desde el Excel mas reciente de la carpeta "proveedor".
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar-catalogo.ps1" %*
echo.
pause
