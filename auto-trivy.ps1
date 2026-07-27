# auto-trivy.ps1
$apiUrl = "https://devsecops-hub-8qlr.onrender.com/api/findings"
$imageName = "backend:latest"
$outputFile = "trivy-output.json"

Write-Host "🔍 Scanning image: $imageName with Trivy..." -ForegroundColor Cyan

# Run Trivy with Docker socket mounted
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v ${PWD}:/root/.cache aquasec/trivy:latest image --format json --output /root/.cache/$outputFile $imageName

if (-not (Test-Path $outputFile)) {
    Write-Host "❌ Failed to generate Trivy output." -ForegroundColor Red
    exit 1
}

$jsonData = Get-Content $outputFile | ConvertFrom-Json
$count = 0

foreach ($r in $jsonData.Results) {
    foreach ($v in $r.Vulnerabilities) {
        if ($v.Severity -in @('CRITICAL','HIGH')) {
            # Map severity to the format your backend expects
            $mappedSeverity = switch ($v.Severity) {
                'CRITICAL' { 'Critical' }
                'HIGH' { 'High' }
                default { 'Medium' }
            }
            
            # Use -f format operator to avoid PowerShell colon issues
            $desc = "{0} - {1} (Package: {2})" -f $v.VulnerabilityID, $v.Title, $v.PkgName
            
            $payload = @{ 
                description = $desc
                severity = $mappedSeverity
                status = "Open"
                remediated = $false
            }
            
            try {
                $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body ($payload | ConvertTo-Json) -ContentType "application/json"
                Write-Host "✅ Added: $($desc.Substring(0, [Math]::Min(60, $desc.Length)))..." -ForegroundColor Green
                $count++
            } catch {
                Write-Host "❌ Failed: $($desc.Substring(0, 50))... Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

Remove-Item $outputFile -Force
Write-Host "`n🎯 Done! Added $count findings to your Compliance Hub." -ForegroundColor Yellow
Write-Host "📊 Check them at: $apiUrl" -ForegroundColor Cyan