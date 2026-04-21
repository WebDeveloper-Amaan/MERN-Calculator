# MERN Calculator

This project is a full-stack calculator built with React, Express, MongoDB, and Node.js.

## Features

- Basic arithmetic: addition, subtraction, multiplication, and division
- Live expression preview and keyboard support
- Dark and light mode toggle
- Saved calculation history
- Clear history action
- MongoDB persistence with a local file fallback when MongoDB is unavailable

## Project Structure

- `client/src` - React calculator UI
- `server` - Express API, models, controllers, and storage helpers
- `shared/evaluate.js` - Safe expression parser used by both client and server

## Setup

1. Install the frontend dependencies from the project root:

   `npm install`

2. Start the React client:

   `npm run dev`

3. In a second terminal, start the API server:

   `node server/index.js`

4. Optional: create a `.env` file in the project root if you want MongoDB persistence:

   `MONGODB_URI=mongodb://127.0.0.1:27017/mern-calculator`

   `PORT=5000`

## API Endpoints

- `POST /calculate` - calculate an expression
- `GET /history` - fetch saved calculations
- `POST /history` - save a calculation
- `DELETE /history` - clear the saved history

## Notes

- The app uses the MongoDB collection when `MONGODB_URI` is available.
- If MongoDB is not configured, the server falls back to a local JSON file so the project still runs locally without errors.