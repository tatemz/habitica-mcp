export const normalizedFilename = (context) => (context.filename ?? "").replaceAll("\\", "/");

export const sourceText = (context) => context.sourceCode.getText();
