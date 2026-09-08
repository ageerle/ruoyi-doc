$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression

$workspaceDir = Split-Path -Parent $PSScriptRoot
$exampleDir = Join-Path $workspaceDir 'examples\langchain4j-memory'
$outputDir = Join-Path $workspaceDir 'docs\public\files'
$archivePath = Join-Path $outputDir 'langchain4j-memory-1.20.0.zip'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# 只打包显式列出的源码和文档，不包含 target、data、凭据或本地配置。
$files = @(
    Get-Item -LiteralPath (Join-Path $exampleDir 'pom.xml')
    Get-Item -LiteralPath (Join-Path $exampleDir 'README.md')
    Get-Item -LiteralPath (Join-Path $exampleDir '.gitignore') -Force
    Get-ChildItem -LiteralPath (Join-Path $exampleDir 'src') -Recurse -File
)
$stream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
try {
    $archive = [System.IO.Compression.ZipArchive]::new(
        $stream, [System.IO.Compression.ZipArchiveMode]::Create, $true)
    try {
        foreach ($file in ($files | Sort-Object FullName)) {
            $relative = $file.FullName.Substring($exampleDir.Length + 1).Replace('\', '/')
            $entry = $archive.CreateEntry('langchain4j-memory/' + $relative)
            $inputStream = $file.OpenRead()
            try {
                $entryStream = $entry.Open()
                try { $inputStream.CopyTo($entryStream) }
                finally { $entryStream.Dispose() }
            } finally { $inputStream.Dispose() }
        }
    } finally { $archive.Dispose() }
} finally { $stream.Dispose() }

Write-Output $archivePath
