# auto-trivy.ps1
# Full automation: Scan with Trivy -> Parse JSON -> POST to Compliance Hub

$apiUrl = "http://localhost:3500/api/findings"
$imageName = "backend:latest"
$outputFile = "trivy-output.json"

Write-Host "🔍 Scanning image: $imageName with Trivy..." -ForegroundColor Cyan

# 1. Run Trivy (via Docker) and save the JSON output
docker run --rm -v ${PWD}:/root/.cache aquasec/trivy:latest image --format json --output /root/.cache/$outputFile $imageName

if (-not (Test-Path $outputFile)) {
    Write-Host "❌ Failed to generate Trivy output." -ForegroundColor Red
    exit 1
}

# 2. Read and parse the JSON file
$jsonData = Get-Content -Path $outputFile | ConvertFrom-Json

$findingsAdded = 0

# 3. Loop through vulnerabilities and POST to API
foreach ($result in $jsonData.Results) {
    foreach ($vuln in $result.Vulnerabilities) {
        $severity = $vuln.Severity
        # Only take Critical and High
        if ($severity -in @('CRITICAL', 'HIGH')) {
            $description = "$($vuln.VulnerabilityID) - $($vuln.Title) (Package: $($vuln.PkgName))"
            
            # Map Trivy severity to your severity enum
            $mappedSeverity = switch ($severity) {
                'CRITICAL' { 'Critical' }
                'HIGH' { 'High' }
                default { 'Medium' }
            }

            $payload = @{
                description = $description
                severity = $mappedSeverity
                status = "Open"
                remediated = $false
            }

            try {
                $jsonBody = $payload | ConvertTo-Json
                Invoke-RestMethod -Uri $apiUrl -Method Post -Body $jsonBody -ContentType "application/json" | Out-Null
                Write-Host "✅ Added: $($description.Substring(0, [Math]::Min(60, $description.Length)))..." -ForegroundColor Green
                $findingsAdded++
            } catch {
                Write-Host "❌ Failed: $($description.Substring(0, 30))... Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# 4. Clean up the temp file
Remove-Item $outputFile -Force -ErrorAction SilentlyContinue

Write-Host "`n🎯 Done! Added $findingsAdded findings to your Compliance Hub." -ForegroundColor Yellow
Write-Host "📊 Refresh your dashboard at http://localhost:8081" -ForegroundColor Cyan