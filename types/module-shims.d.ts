declare module "@radix-ui/react-label" {
  import * as React from "react";

  export const Root: React.ForwardRefExoticComponent<
    React.LabelHTMLAttributes<HTMLLabelElement> & React.RefAttributes<HTMLLabelElement>
  >;
}

declare module "class-variance-authority" {
  export const cva: (...args: any[]) => (...args: any[]) => string;
  export type VariantProps<T> = T extends (...args: any[]) => any ? Record<string, any> : never;
}
