export function getDefaultTemplate(type: string, format: string = 'markdown'): string {
    if (format === 'latex') {
        const latexTemplates: Record<string, string> = {
            research: `\\documentclass{article}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{Research Paper Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract here...
\\end{abstract}

\\section{Introduction}
Introduction to the research...

\\section{Methodology}
Description of methods...

\\section{Results}
Presentation of results...

\\section{Conclusion}
Summary and conclusions...

\\end{document}`,

            engineering: `\\documentclass{article}
\\usepackage{listings}
\\usepackage{xcolor}

\\title{Technical Specification}
\\author{Engineering Team}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Overview}
Brief description of the project...

\\section{Requirements}
\\subsection{Functional}
\\begin{itemize}
    \\item Feature 1
    \\item Feature 2
\\end{itemize}

\\section{Architecture}
High-level system design...

\\section{Implementation}
\\begin{lstlisting}[language=Python]
def hello_world():
    print("Hello World")
\\end{lstlisting}

\\end{document}`,

            general: `\\documentclass{article}

\\title{Document Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Section 1}
Start typing here...

\\end{document}`,

            healthcare: `\\documentclass{article}

\\title{Medical Report}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Patient Information}
Details...

\\section{Diagnosis}
Details...

\\end{document}`,

            meeting: `\\documentclass{article}

\\title{Meeting Minutes}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Agenda}
\\begin{itemize}
    \\item Item 1
\\end{itemize}

\\section{Action Items}
\\begin{itemize}
    \\item Task 1
\\end{itemize}

\\end{document}`
        };
        return latexTemplates[type] || latexTemplates.general;
    }

    // Markdown templates
    const markdownTemplates: Record<string, string> = {
        research: '# Research Title\n\n## Abstract\n\n## Introduction\n\n## Methodology\n\n## Results\n\n## Conclusion',
        engineering: '# Technical Spec\n\n## Overview\n\n## Architecture\n\n## Implementation\n\n## API Reference',
        healthcare: '# Patient Report\n\n## Symptoms\n\n## Diagnosis\n\n## Treatment Plan',
        meeting: '# Meeting Minutes\n\n## Attendees\n\n## Agenda\n\n## Action Items',
        general: '# Untitled Document\n\nStart typing here...'
    };

    return markdownTemplates[type] || markdownTemplates.general;
}
