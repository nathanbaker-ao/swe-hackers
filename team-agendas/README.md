# Team Agendas

Meeting agendas and presentations for AutoNateAI team syncs.

## Folder Structure

```
team-agendas/
├── README.md
└── YYYY/
    └── MM/
        └── DD/
            ├── agenda.md           # Meeting agenda (markdown)
            ├── agenda.pdf          # Exported PDF for sharing
            └── presentation.html   # Animated HTML slideshow
```

## Example

```
team-agendas/
└── 2025/
    └── 01/
        └── 06/
            ├── agenda.md
            ├── agenda.pdf
            └── presentation.html
```

## Creating a New Meeting

1. Create the folder structure:
   ```bash
   mkdir -p team-agendas/2025/01/15
   ```

2. Use `@meeting-prep` rule to generate the agenda:
   ```
   Create a meeting agenda for January 15, 2025 using @meeting-prep
   
   Topics:
   - Topic 1
   - Topic 2
   ```

3. Use `@meeting-presentation` to generate the slideshow:
   ```
   Create a presentation from the agenda using @meeting-presentation
   ```

4. Export agenda to PDF for sharing:
   ```bash
   # Uses mermaid-cli to render diagrams, then weasyprint for PDF
   npx @mermaid-js/mermaid-cli -i agenda.md -o agenda-rendered.md -e png
   pandoc agenda-rendered.md -o temp.html --standalone
   weasyprint temp.html agenda.pdf
   ```

## Viewing Presentations

Open `presentation.html` in a browser. Navigate with:
- `→` or `Space` - Next slide
- `←` - Previous slide
- Click right side - Next slide
- Click left side - Previous slide
