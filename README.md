# Air Quality Dashboard

React + Vite frontend and FastAPI backend for a ThingSpeak-powered air quality dashboard.

## Features

- Live sensor cards for temperature, humidity, PM2.5, PM10, calculated AQI, node status, and last updated time in IST.
- Auto-refresh every 15 seconds.
- UTC ThingSpeak timestamps are converted to IST on the backend.
- AQI is calculated from PM2.5 with the US EPA breakpoint method.
- Live ECharts graphs for temperature, humidity, PM2.5, PM10, and AQI.
- Advanced graph popup with multi-parameter plotting, custom date/time ranges, zoom, pan, reset, and CSV export.
- Comparison mode for Today vs Yesterday or two custom ranges, with side-by-side averages and percentage difference.
- CSV export for displayed, filtered, and comparison-related data.
- Alert checks for PM2.5, PM10, AQI, and node offline status.
- Cooking-baseline alerts compare live PM2.5, PM10, and AQI against the matching day and meal-period baseline from `backend/data/cooking_pollution_baseline.csv`.
- WhatsApp alert adapters for Twilio, Meta Cloud API, CallMeBot, and UltraMsg.

## Project Structure

```text
AirQualityDashboard/
  backend/
    main.py
    thingspeak.py
    aqi.py
    alerts.py
    scheduler.py
    csv_export.py
    comparison.py
    config.py
  frontend/
    src/
      pages/
      components/
      charts/
      services/
      hooks/
      utils/
      styles/
  README.md
  requirements.txt
  package.json
```

## Backend Setup

```bash
cd AirQualityDashboard
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

If no ThingSpeak channel is configured, the backend serves realistic mock data so the dashboard can be opened immediately.

Create `backend/.env` from `backend/.env.example` and set:

```text
THINGSPEAK_CHANNEL_ID=your_channel_id
THINGSPEAK_READ_API_KEY=your_read_key
```

The expected ThingSpeak field mapping is:

- `field1`: Temperature
- `field2`: Humidity
- `field3`: PM2.5
- `field4`: PM10

Cooking-baseline alerts use `COOKING_BASELINE_STAT=P95` by default, meaning an alert is shown when the current reading is above the normal 95th-percentile cooking level for that day and meal period.

## Frontend Setup

```bash
cd AirQualityDashboard
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Deploy From GitHub

GitHub stores the code, but the FastAPI backend needs a server host to stay live. This project includes a `Dockerfile` and `render.yaml` so it can be deployed as one web service on Render or any Docker-capable host.

On Render:

1. Push this folder to a GitHub repository.
2. Create a new Render web service from that repository.
3. Choose Docker deployment.
4. Set `THINGSPEAK_READ_API_KEY` in Render environment variables.
5. Deploy.

The backend serves the built React dashboard from `frontend/dist`, so one service hosts both the API and dashboard.

## WhatsApp Alerts

WhatsApp messages cannot be sent directly from the browser. Configure one backend provider in `backend/.env`:

- `WHATSAPP_PROVIDER=twilio`
- `WHATSAPP_PROVIDER=meta`
- `WHATSAPP_PROVIDER=callmebot`
- `WHATSAPP_PROVIDER=ultramsg`

The default alert destination is `9059236651`. Provider credentials are listed in `backend/.env.example`.

## API Endpoints

- `GET /api/dashboard`
- `GET /api/data?start=<IST_ISO>&end=<IST_ISO>`
- `GET /api/compare`
- `GET /api/export.csv`
- `POST /api/alerts/test`
