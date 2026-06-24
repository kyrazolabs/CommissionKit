import type { ComponentPropsWithoutRef } from "react";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type ParaProps = ComponentPropsWithoutRef<"p">;
type AnchorProps = ComponentPropsWithoutRef<"a">;
type ListProps = ComponentPropsWithoutRef<"ul" | "ol">;
type ListItemProps = ComponentPropsWithoutRef<"li">;
type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">;
type ImgProps = ComponentPropsWithoutRef<"img">;
type PreProps = ComponentPropsWithoutRef<"pre">;
type CodeProps = ComponentPropsWithoutRef<"code">;
type TableProps = ComponentPropsWithoutRef<"table">;
type ThProps = ComponentPropsWithoutRef<"th">;
type TdProps = ComponentPropsWithoutRef<"td">;
type HrProps = ComponentPropsWithoutRef<"hr">;

type ComponentMap = Record<string, React.FC<any>>;

export function useMDXComponents(components: ComponentMap): ComponentMap {
  return {
    h1: (props: HeadingProps) => (
      <h1 className="text-3xl font-bold text-foreground mt-12 mb-4 tracking-tight" {...props} />
    ),
    h2: (props: HeadingProps) => (
      <h2 className="text-2xl font-semibold text-foreground mt-10 mb-3 tracking-tight" {...props} />
    ),
    h3: (props: HeadingProps) => (
      <h3 className="text-xl font-semibold text-foreground mt-8 mb-2" {...props} />
    ),
    p: (props: ParaProps) => (
      <p className="text-base text-muted-foreground leading-relaxed mb-4" {...props} />
    ),
    a: ({ href, ...props }: AnchorProps) => (
      <a href={href} className="text-primary underline underline-offset-4 hover:text-primary/80" {...props} />
    ),
    ul: (props: ListProps) => (
      <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground" {...props} />
    ),
    ol: (props: ListProps) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1 text-muted-foreground" {...props} />
    ),
    li: (props: ListItemProps) => (
      <li className="text-base leading-relaxed" {...props} />
    ),
    blockquote: (props: BlockquoteProps) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-6" {...props} />
    ),
    img: ({ src, alt, ...props }: ImgProps) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="rounded-xl my-6 max-w-full" {...props} />
    ),
    pre: (props: PreProps) => (
      <pre className="rounded-xl bg-muted p-4 overflow-x-auto text-sm my-6" {...props} />
    ),
    code: (props: CodeProps) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
    ),
    hr: (props: HrProps) => <hr className="border-border my-10" {...props} />,
    table: (props: TableProps) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: (props: ThProps) => (
      <th className="border border-border bg-muted px-4 py-2 text-left font-semibold text-foreground" {...props} />
    ),
    td: (props: TdProps) => (
      <td className="border border-border px-4 py-2 text-muted-foreground" {...props} />
    ),
    ...components,
  };
}
