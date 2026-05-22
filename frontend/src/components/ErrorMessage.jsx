export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start justify-between gap-3">
      <div>
        <p className="font-medium">Something went wrong</p>
        <p className="mt-0.5 text-red-700/90">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-700 hover:text-red-900 text-xs font-medium"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
