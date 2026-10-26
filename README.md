# Movie Watchlist: Frontend

A React single-page app for the Movie Watchlist. Create an account, search TMDB for movies, build your own watchlist, mark movies as watched, and get recommendations based on what you have saved.

- Backend repo (the API this app talks to): https://github.com/aryan03730/movie-watchlist-backend
- Live app: https://movie-watchlist-frontend-six.vercel.app (the backend runs on a free tier, so the first request can take up to ~50 seconds while it wakes up)

## Features

- Sign up and log in with email and password
- Search TMDB and add a movie to your watchlist with the **+** button
- Add a movie by hand with a title and year
- Mark movies as watched or unwatched, and delete them
- A "Recommended for you" section that suggests movies based on your watchlist (hover a poster to see which of your movies it came from)
- If your login expires, the app sends you back to the login screen

## Tech stack

React 18, Vite 5, plain CSS, and the browser `fetch` API. There are no UI libraries.

## Run it locally

You need Node.js 18 or newer and the backend running locally. Follow the backend README first: https://github.com/aryan03730/movie-watchlist-backend. It should answer at http://localhost:5050.

1. Clone the repo and go into it:

```
git clone https://github.com/aryan03730/movie-watchlist-frontend.git
cd movie-watchlist-frontend
```

2. Install the dependencies:

```
npm install
```

3. Start the dev server:

```
npm run dev
```

4. Open http://localhost:3000 in your browser and create an account.

### Using a different backend

By default the app talks to `http://localhost:5050`. To use another backend, such as the deployed one, create a `.env.local` file:

```
cp .env.example .env.local
```

Then edit `VITE_API_URL` in `.env.local` and restart `npm run dev`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server on http://localhost:3000 |
| `npm run build` | Builds the production app into `dist/` |
| `npm run preview` | Serves the production build locally |

## How it works

- `src/api.js` is the only place that calls the backend. It adds the login token to every request and, if the backend answers 401 to a request that carried a token, clears the token and returns to the login screen.
- The login token is kept in the browser's `localStorage`, so you stay signed in after a refresh.
- After you add or delete a movie, the app reloads your watchlist and your recommendations.

## Project layout

```
index.html          page shell
src/main.jsx        app entry point
src/App.jsx         the main page: watchlist, search, recommendations
src/AuthForm.jsx    login and signup form
src/api.js          fetch helper and token handling
src/App.css         all styles
vite.config.js      Vite settings (dev server on port 3000)
```

## Deployment

The app is deployed on Vercel and redeploys automatically whenever `main` changes. Set the `VITE_API_URL` environment variable in the Vercel project to the backend's public URL. Vite reads it at build time, so redeploy after changing it.

## Known limitations

- The login token lives in `localStorage`, which is simple but readable by any script running on the page. HttpOnly cookies would be safer.
- There are no automated frontend tests yet. The backend has a pytest suite.
