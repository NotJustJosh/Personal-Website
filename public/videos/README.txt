Drop short looping clips here (hardware moving, a demo run, a gait test).

Reference them from src/content.ts on any project, e.g.:

  video: 'videos/spider-robot.mp4'
  video: { src: 'videos/spider-robot.mp4',
           poster: 'images/spider-robot.jpg',
           caption: 'Gait test - servo PWM from the DE10-Nano' }

Tips
  * MP4 (H.264 + AAC) plays everywhere. WebM is smaller but less universal.
    The main README has the ffmpeg command for turning a phone clip into a
    720p H.264 file with faststart, plus a poster frame.
  * In the 3D card, clips autoplay MUTED and LOOP forever, so keep them SHORT -
    3-8 seconds. On the plain page (projects/) the same clip gets controls,
    never autoplays, and keeps its sound.
  * Keep it under ~5 MB. These load with the card, and GitHub Pages has a
    100 MB hard limit per file plus a ~1 GB soft limit per repo.
  * ~720p is plenty - the card renders it well under 600px wide.
  * Add a `poster:` still: it's what shows on a slow connection, for visitors
    with "reduce motion" on, and in place of the video when the plain page is
    printed.
