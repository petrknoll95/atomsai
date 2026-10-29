# FAQ submission prototype

The existing question field now submits with Enter or its arrow button. A local,
open FAQ is appended before the form. GSAP animates its insertion, a brief
thinking state, the answer area, and a staggered word reveal. Existing native
FAQ collapse/expand behavior remains available. The answer is explicitly marked
as a sample; no question is sent to a server, and entries reset on page reload.

Only one answer is generated at a time. Blank submissions are ignored; the field
remains available for drafting the next question. Reduced motion skips the
sequence. A polite status announces preparation and the finished answer, rather
than announcing every word.

With the development preview on port 3001, run:

```sh
node scripts/faq-prototype-check.mjs
```

Checks cover Chromium and WebKit at 1440px and 390px: Enter/button submission,
blank input, progressive reveal, prevention of duplicate submissions, subsequent
questions, native accordion interaction, reduced motion, long question wrapping,
and browser errors. Screenshots and animation samples are saved beside this file.
