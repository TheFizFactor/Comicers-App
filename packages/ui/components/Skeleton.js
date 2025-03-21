import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@comicers/ui/util';
function Skeleton({ className, ...props }) {
    return _jsx("div", { className: cn('animate-pulse rounded-md bg-primary/10', className), ...props });
}
export { Skeleton };
