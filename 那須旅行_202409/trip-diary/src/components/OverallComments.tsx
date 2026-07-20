import type { TripComment } from "../types/trip";

interface OverallCommentsProps {
  comments: TripComment[];
}

export default function OverallComments({ comments }: OverallCommentsProps) {
  if (comments.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">みんなの感想</h2>
      <ul className="space-y-4">
        {comments.map((comment, index) => (
          <li key={`${comment.name}-${index}`} className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-slate-700">{comment.name}</p>
            {comment.text && (
              <p className="whitespace-pre-wrap text-sm text-slate-600">{comment.text}</p>
            )}
            {comment.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {comment.photos.map((photo) => (
                  <img
                    key={photo}
                    src={`${import.meta.env.BASE_URL}${photo}`}
                    alt={comment.name}
                    loading="lazy"
                    className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
