# IT-Anleitung: CSV-Synchronisation zur Replit-App

## Übersicht
Diese Anleitung beschreibt, wie ein PowerShell-Skript auf dem Firmenserver eingerichtet wird, um CSV-Dateien mit Umsatzkennzahlen automatisch alle 2 Minuten an die Replit-App zu übertragen.

---

## Benötigte Informationen

| Parameter | Wert |
|-----------|------|
| **API-URL** | `https://digital-butler--kneuss.replit.app/api/upload-csv` |
| **API-Key** | Der API-Key wurde im Replit-Projekt als Secret `CSV_UPLOAD_API_KEY` hinterlegt |
| **CSV-Pfad** | Lokaler Pfad zur CSV-Datei auf dem Firmenserver |
| **Status-Seite** | `https://digital-butler--kneuss.replit.app/csv-status` |

---

## PowerShell-Skript

Erstellen Sie eine Datei `csv-sync.ps1` auf dem Firmenserver:

```powershell
# CSV-Sync Skript für Replit-App
# Version 1.0

# ===== KONFIGURATION - BITTE ANPASSEN =====
$ApiUrl = "https://digital-butler--kneuss.replit.app/api/upload-csv"
$ApiKey = "[HIER-API-KEY-EINFÜGEN]"
$CsvFilePath = "C:\Pfad\zur\umsatzkennzahlen.csv"
# ==========================================

# Prüfen ob Datei existiert
if (-not (Test-Path $CsvFilePath)) {
    Write-Error "CSV-Datei nicht gefunden: $CsvFilePath"
    exit 1
}

# CSV-Inhalt lesen
$CsvContent = Get-Content -Path $CsvFilePath -Raw -Encoding UTF8

# Dateiname extrahieren
$FileName = Split-Path -Path $CsvFilePath -Leaf

# HTTP-Request vorbereiten
$Headers = @{
    "Content-Type" = "text/csv"
    "X-API-Key" = $ApiKey
    "X-Filename" = $FileName
}

try {
    # Daten senden
    $Response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Headers $Headers -Body $CsvContent
    
    # Erfolg protokollieren
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "[$Timestamp] Upload erfolgreich: $($Response.rowCount) Zeilen hochgeladen"
    
} catch {
    # Fehler protokollieren
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Error "[$Timestamp] Upload fehlgeschlagen: $($_.Exception.Message)"
    exit 1
}
```

---

## Einrichtung als geplante Aufgabe (Windows Task Scheduler)

### Option 1: Über die GUI

1. **Aufgabenplanung öffnen**: `taskschd.msc`
2. **Neue Aufgabe erstellen**: "Aktion" → "Aufgabe erstellen..."
3. **Allgemein-Tab**:
   - Name: `CSV-Sync zu Replit`
   - "Mit höchsten Privilegien ausführen" aktivieren
   - "Unabhängig von der Benutzeranmeldung ausführen" auswählen
4. **Trigger-Tab**:
   - Neuer Trigger → Täglich
   - Wiederholen alle **2 Minuten** für die Dauer von **1 Tag**
5. **Aktionen-Tab**:
   - Neue Aktion → "Programm starten"
   - Programm: `powershell.exe`
   - Argumente: `-ExecutionPolicy Bypass -File "C:\Pfad\zum\csv-sync.ps1"`
6. **Einstellungen-Tab**:
   - "Aufgabe beenden, falls sie länger als 1 Stunde ausgeführt wird" aktivieren

### Option 2: Per PowerShell-Befehl

```powershell
# Geplante Aufgabe erstellen
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-ExecutionPolicy Bypass -File "C:\Pfad\zum\csv-sync.ps1"'
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 2) -RepetitionDuration ([TimeSpan]::MaxValue)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "CSV-Sync zu Replit" -Action $Action -Trigger $Trigger -Principal $Principal
```

---

## Testen

### Manueller Test
Führen Sie das Skript einmal manuell aus:
```powershell
powershell.exe -ExecutionPolicy Bypass -File "C:\Pfad\zum\csv-sync.ps1"
```

### Erwartete Ausgabe bei Erfolg:
```
[2026-01-21 12:05:42] Upload erfolgreich: 150 Zeilen hochgeladen
```

### Status in der App überprüfen
Öffnen Sie im Browser: `https://digital-butler--kneuss.replit.app/csv-status`

---

## Logging (Optional)

Um alle Uploads zu protokollieren, erweitern Sie das Skript um Logging:

```powershell
# Am Anfang des Skripts
$LogFile = "C:\Logs\csv-sync.log"

# Logging-Funktion
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$Timestamp] $Message" | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Im try-Block
Write-Log "Upload erfolgreich: $($Response.rowCount) Zeilen"

# Im catch-Block
Write-Log "Upload fehlgeschlagen: $($_.Exception.Message)"
```

---

## Fehlerbehebung

| Fehler | Lösung |
|--------|--------|
| `401 Unauthorized` | API-Key überprüfen |
| `500 Server Error` | App-URL überprüfen, App-Status kontrollieren |
| `Datei nicht gefunden` | Pfad zur CSV-Datei korrigieren |
| `Netzwerkfehler` | Firewall-Regeln prüfen (HTTPS Port 443 muss erlaubt sein) |

---

## Sicherheitshinweise

- **API-Key geheim halten**: Nicht in E-Mails versenden oder in geteilten Ordnern speichern
- **HTTPS verwenden**: Die Verbindung ist verschlüsselt
- **Zugriffsrechte**: Nur Administratoren sollten Zugriff auf das Skript haben

---

## Kontakt

Bei Fragen zur Einrichtung wenden Sie sich an den Projektverantwortlichen.
