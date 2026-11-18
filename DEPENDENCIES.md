# Third-Party Reference Repositories & Dependency Manifest

As per the VAC Studio design doctrine (*"君子使物，不以物使，一切为我所用"*), the following third-party repositories are maintained as standalone local reference checkouts. They are excluded from the main repository via `.gitignore` to prevent nested submodule and gitlink state conflicts:

| Package / Repository | Upstream Remote URL | Pinned Commit Hash | Role in VAC Ecosystem |
| :--- | :--- | :--- | :--- |
| **cinetic** | `https://github.com/Leonxlnx/cinetic.git` | `ecfa6605de1adb9345ce937724810dc32267d068` | Code-driven cinematic motion design reference |
| **earshot** | `https://github.com/Leonxlnx/earshot.git` | `591fa3e028032e6dce56620a20e932e35667e8d8` | CPU-only procedural audio synthesis & BS.1770 loudness |
| **motion2code** | `https://github.com/lovisdotio/motion2code.git` | `0f003288997604487df04c1b7a0586900d3e36bb` | AI video deconstruct to SVG & GSAP animation loop |
| **openmotion** | `https://github.com/nexu-io/openmotion.git` | `d2bbbe032b1d883af1d3922d73268e7941c353fd` | Template catalog & editor interface reference |
| **taste-skill** | `https://github.com/Leonxlnx/taste-skill.git` | `6010f91a9935f1c167dfc500fb1a475681892e6b` | Anti-slop frontend art direction & inspection rules |
