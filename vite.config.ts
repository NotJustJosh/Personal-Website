import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─────────────────────────────────────────────────────────────────────────────
//  GitHub Pages base path  (READ THIS — it is the #1 cause of a blank page)
// ─────────────────────────────────────────────────────────────────────────────
//  GitHub Pages serves a PROJECT repo from a sub-path:
//      https://<username>.github.io/<REPO_NAME>/
//  Every JS/CSS/asset URL therefore has to be prefixed with "/<REPO_NAME>/".
//  Vite does that for you when `base` is set correctly.
//
//      👉  Set REPO_NAME below to the exact name of your GitHub repository.
//          Keep the leading and trailing slash: '/My-Repo/'.
//
//  EXCEPTIONS — set `base` to '/' instead if either of these is true:
//      • You deploy to a USER/ORG site (repo is literally "<username>.github.io").
//      • You use a custom domain (CNAME).
//
//  You can also override without editing this file via the BASE_PATH env var,
//  e.g.  BASE_PATH=/ npm run build
// ─────────────────────────────────────────────────────────────────────────────
const REPO_NAME = 'Personal-Website' // <-- CHANGE THIS to your repo name

const base = process.env.BASE_PATH ?? `/${REPO_NAME}/`

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
