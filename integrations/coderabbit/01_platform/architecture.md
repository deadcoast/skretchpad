# The System Behind Every Review Comment

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit Architecture | How CodeRabbit works internally

While other tools just scan your changed code, CodeRabbit **orchestrates an entire system** for every single review. This isn't a simple "review this changeset" prompt to an LLM. It's a **production-grade AI infrastructure** designed for one purpose: understanding your code at the deepest level possible.

<Frame caption="CodeRabbit Architecture">
    <img src="https://mintcdn.com/coderabbit/JDF48eE9RUTOwhLY/images/assets/images/architecture.png?fit=max&auto=format&n=JDF48eE9RUTOwhLY&q=85&s=b962fbb736c591ed9f7ba3adfe2cdcb9" alt="CodeRabbit Architecture" data-og-width="1902" width="1902" data-og-height="912" height="912" data-path="images/assets/images/architecture.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/JDF48eE9RUTOwhLY/images/assets/images/architecture.png?w=280&fit=max&auto=format&n=JDF48eE9RUTOwhLY&q=85&s=ab68407b5b6380f59d869729322bd87c 280w, https://mintcdn.com/coderabbit/JDF48eE9RUTOwhLY/images/assets/images/architecture.png?w=560&fit=max&auto=format&n=JDF48eE9RUTOwhLY&q=85&s=0b7ebc4dd8be552a795d57e40a501f74 560w, https://mintcdn.com/coderabbit/JDF48eE9RUTOwhLY/images/assets/images/architecture.png?w=840&fit=max&auto=format&n=JDF48eE9RUTOwhLY&q=85&s=01913cb04850d7b32bb863aa3167360d 840w, https://mintcdn.com/coderabbit/JDF48eE9RUTOwhLY/images/assets/images/architecture.png?w=1100&fit=max&auto=format&n=JDF48eE9RUTOwhLY&q=85&s=5f6e9f45cbd8d49aa962e7a35b38fd9c 1100w, https://mintcdn.com/coderabbit/JDF48eE9RUTOwhLY/images/assets/images/architecture.png?w=1650&fit=max&auto=format&n=JDF48eE9RUTOwhLY&q=85&s=03b3024c8006307e5fb221a39c93e49a 1650w, https://mintcdn.com/coderabbit/JDF48eE9RUTOwhLY/images/assets/images/architecture.png?w=2500&fit=max&auto=format&n=JDF48eE9RUTOwhLY&q=85&s=27a1f73e1e83adf3dace8abf65fbae9f 2500w" />
</Frame>

Behind each comment lies:

* **Sandboxed cloud execution** with your full repository cloned for isolated analysis
* **Multi-dimensional code analysis** combining 40+ static analyzers, linters and SAST tools
* **Agentic exploration** that autonomously investigates your codebase for context
* **Specialized AI agents** working in parallel: Review, Verification, Chat, Pre-Merge Checks, and Finishing Touches
* **Living memory** that learns from your feedback, PRs, issues, and coding guidelines
* **Enterprise integrations** connecting your entire development workflow

**That's why CodeRabbit doesn't just review code, it understands it.**
