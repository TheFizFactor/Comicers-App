import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const buttonVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "link" | "ghost" | null | undefined;
    size?: "default" | "xs" | "sm" | "lg" | "icon" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button, buttonVariants };
//# sourceMappingURL=Button.d.ts.map