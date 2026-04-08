type ToastMessage = string;

function emit(type: "success" | "error" | "message", message: ToastMessage) {
  if (typeof window !== "undefined") {
    console[type === "error" ? "error" : "log"](`[${type}] ${message}`);
  }
}

export const toast = {
  success(message: ToastMessage) {
    emit("success", message);
  },
  error(message: ToastMessage) {
    emit("error", message);
  },
  message(message: ToastMessage) {
    emit("message", message);
  }
};
