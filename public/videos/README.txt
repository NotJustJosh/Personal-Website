Drop short looping clips here (hardware moving, a demo run, a gait test).

Reference them from src/content.ts on any project, e.g.:

  video: 'videos/spider-robot.mp4'
  video: { src: 'videos/spider-robot.mp4',
           poster: 'images/spider-robot.jpg',
           caption: 'Gait test - servo PWM from the DE10-Nano' }

Tips
  * MP4 (H.264 + AAC) plays everywhere. WebM is smaller but less universal.
  * Clips autoplay MUTED and LOOP forever, so keep them SHORT - 3-8 seconds.
    Any audio track is ignored; strip it to save bytes.
  * Keep it under ~5 MB. These load with the card, and GitHub Pages has a
    100 MB hard limit per file plus a ~1 GB soft limit per repo.
  * ~720p is plenty - the card renders it well under 600px wide.
  * Optionally add a `poster:` still so there's something to look at on a
    slow connection, and for visitors who have "reduce motion" turned on.
