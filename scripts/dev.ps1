$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$python = Join-Path $projectRoot ".venv\Scripts\python.exe"
$backendScript = Join-Path $projectRoot "be\admin_app.py"

if (-not (Test-Path -LiteralPath $python)) {
  throw "Python virtual environment tidak ditemukan di .venv. Buat dan pasang dependensi terlebih dahulu."
}

$backendStarted = $false
$backendProcess = $null
$stdoutLog = Join-Path $env:TEMP ("mtsn-backend-{0}.out.log" -f $PID)
$stderrLog = Join-Path $env:TEMP ("mtsn-backend-{0}.err.log" -f $PID)

try {
  $backendReady = $false
  try {
    $healthResponse = Invoke-WebRequest -Uri "http://127.0.0.1:5001/api/navigation" -UseBasicParsing -TimeoutSec 2
    $backendReady = $healthResponse.StatusCode -eq 200
  } catch {
    $backendReady = $false
  }

  if (-not $backendReady) {
    $adminUsername = $env:ADMIN_USERNAME
    if (-not $adminUsername) {
      $adminUsername = Read-Host "Username admin (kosongkan untuk admin)"
      if (-not $adminUsername) {
        $adminUsername = "admin"
      }
    }

    $adminPassword = $env:ADMIN_PASSWORD
    if (-not $adminPassword) {
      $securePassword = Read-Host "Password admin (minimal 12 karakter)" -AsSecureString
      $adminPassword = [System.Net.NetworkCredential]::new("", $securePassword).Password
    }
    if ($adminPassword.Length -lt 12) {
      throw "Password admin harus memiliki minimal 12 karakter."
    }

    $env:FLASK_SECRET_KEY = [Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N")
    $env:ADMIN_USERNAME = $adminUsername
    $env:ADMIN_PASSWORD = $adminPassword
    $env:PORT = "5001"

    Write-Host "Menyalakan backend admin di http://127.0.0.1:5001 ..."
    $quotedScript = '"' + $backendScript + '"'
    $backendProcess = Start-Process `
      -FilePath $python `
      -ArgumentList $quotedScript `
      -WorkingDirectory $projectRoot `
      -PassThru `
      -RedirectStandardOutput $stdoutLog `
      -RedirectStandardError $stderrLog
    $backendStarted = $true

    for ($attempt = 0; $attempt -lt 30; $attempt++) {
      $backendProcess.Refresh()
      if ($backendProcess.HasExited) {
        $details = ""
        if (Test-Path -LiteralPath $stderrLog) {
          $details = Get-Content -LiteralPath $stderrLog -Raw
        }
        throw "Backend berhenti sebelum siap. $details"
      }
      try {
        $healthResponse = Invoke-WebRequest -Uri "http://127.0.0.1:5001/api/navigation" -UseBasicParsing -TimeoutSec 2
        if ($healthResponse.StatusCode -eq 200) {
          $backendReady = $true
          break
        }
      } catch {
        Start-Sleep -Milliseconds 500
      }
    }

    if (-not $backendReady) {
      throw "Backend tidak merespons di port 5001 dalam 15 detik."
    }
  } else {
    Write-Host "Backend admin sudah berjalan di port 5001."
  }

  Write-Host "Menjalankan website di http://127.0.0.1:5173 ..."
  Push-Location $projectRoot
  try {
    npm --prefix fe run dev -- --host 127.0.0.1
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  } finally {
    Pop-Location
  }
} finally {
  if ($backendStarted -and $backendProcess) {
    $backendProcess.Refresh()
    if (-not $backendProcess.HasExited) {
      Stop-Process -Id $backendProcess.Id
    }
  }
  Remove-Item -LiteralPath $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue
}
