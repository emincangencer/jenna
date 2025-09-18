# Jenna

Jenna is a Next.js application designed as an AI Assistant for local hosting. It has necessary file, web and mcp tools.

## Key Features

*   **AI Integration**: Supports Google, Groq, and OpenAI AI SDKs.
*   **Interactive UI**: Built with Next.js, Tailwind CSS, and Radix UI components.
*   **AI Elements**: Displays diverse AI outputs like actions, reasoning, and context.

## Technologies Used

*   **Framework**: Next.js
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Components**: Shadcn, ai-elements
*   **LLM**: Vercel AI-SDK


## Installation

### Prerequisites

*   Node.js (v18+)
*   pnpm

### Steps

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/emincangencer/jenna.git
    cd jenna-next
    ```
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

## Configuration

~/.config/jenna/settings.json

### MCP Servers

Example:
```
{
  "mcpServers": {
    "github.com/upstash/context7-mcp": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "command": "bunx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest"
      ],
      "transportType": "stdio"
    }
  }
}
```

## Usage

### Development

To run the development server:

```bash
pnpm dev
```

Access the application at `http://localhost:3000`.

## Configuration

Create a `.env.local` file in the project root for environment variables, especially for AI service API keys from `.env.example`

## Testing

- For now:

*   `pnpm precheck`


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.