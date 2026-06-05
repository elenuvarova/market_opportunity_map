export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="notice-danger flex items-start justify-between gap-3"
    >
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
