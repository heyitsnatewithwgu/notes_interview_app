import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function NoteSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pl-10">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 w-24 mt-2" />
      </CardHeader>
    </Card>
  );
}

export function NoteSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <NoteSkeleton key={i} />
      ))}
    </div>
  );
}
