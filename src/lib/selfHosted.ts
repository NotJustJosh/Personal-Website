import { configureTextBuilder } from 'troika-three-text'
import { useGLTF } from '@react-three/drei'
import { asset } from './paths'

// ─────────────────────────────────────────────────────────────────────────────
//  Everything the 3D world loads comes from this site — no CDNs — so the
//  production build works with no network at all. Imported first by
//  start.tsx: both settings must be in place before anything loads.
//
//  • Label font: drei's <Text> (troika) otherwise fetches its font and Unicode
//    tables from cdn.jsdelivr.net. public/fonts/unicode-font-resolver/ is a
//    copy of exactly the files it was fetching (same pinned version), so the
//    labels look identical. It has to be an ABSOLUTE URL: troika fetches from
//    a blob: worker, where a site-relative path doesn't resolve.
//  • Draco decoder: drei's default points at gstatic.com. None of the current
//    models are Draco-compressed, so nothing is fetched today; this keeps a
//    future one offline too. (The cloud texture is set in CloudLayer.tsx.)
// ─────────────────────────────────────────────────────────────────────────────

configureTextBuilder({
  unicodeFontsURL: new URL(asset('fonts/unicode-font-resolver'), window.location.href).href,
})

useGLTF.setDecoderPath(asset('draco/'))
