$envFile = "newsapi.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "GEMINI_API_KEY=(.+)") {
            $env:GEMINI_API_KEY = $matches[1].Trim()
        }
    }
}

$apiKey = $env:GEMINI_API_KEY
if (-not $apiKey) {
    Write-Host "Error: GEMINI_API_KEY environment variable is not set and could not be loaded from newsapi.env."
    exit 1
}

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=$apiKey"
try {
    $response = Invoke-RestMethod -Uri $url -Method Get
    $response.models | Where-Object { $_.name -like "*flash*" } | ForEach-Object { 
        Write-Host "Model: $($_.name)"
        Write-Host "Display Name: $($_.displayName)"
        Write-Host "--------------------------------"
    }
}
catch {
    Write-Host "Error fetching models: $_"
}
