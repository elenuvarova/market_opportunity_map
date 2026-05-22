import { forwardRef } from "react";

const FileUpload = forwardRef(function FileUpload({ onFile, disabled }, ref) {
  return (
    <input
      ref={ref}
      type="file"
      accept=".csv,text/csv"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
      }}
      disabled={disabled}
    />
  );
});

export default FileUpload;
