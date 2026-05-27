// Minimal Ricos JSON → plain-text extractor.
// Walks the node tree, picking up text from PARAGRAPH / HEADING / LIST_ITEM
// and joins paragraphs with double line breaks. Anything outside the
// common subset is skipped silently. Use for short bios, captions, etc.
// For full-fidelity rendering (galleries, embeds, decorations) use the
// @wix/ricos React viewer instead.

type RicosNode = {
	type?: string;
	nodes?: RicosNode[];
	textData?: { text?: string };
};

export function ricosToPlainText(input: unknown): string {
	if (!input || typeof input !== "object") return "";
	const root = input as RicosNode;

	const paragraphs: string[] = [];
	const walk = (node: RicosNode, buf: string[]) => {
		if (node.textData?.text) buf.push(node.textData.text);
		if (node.nodes) for (const child of node.nodes) walk(child, buf);
	};

	const blocks = root.nodes ?? [];
	for (const block of blocks) {
		const buf: string[] = [];
		walk(block, buf);
		const text = buf.join("").trim();
		if (text) paragraphs.push(text);
	}
	return paragraphs.join("\n\n");
}
