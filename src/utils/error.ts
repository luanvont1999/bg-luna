export function translateError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
      return "Email hoặc mật khẩu không chính xác!";
    case "auth/email-already-in-use":
      return "Email này đã được sử dụng cho một tài khoản khác!";
    case "auth/weak-password":
      return "Mật khẩu phải dài ít nhất 6 ký tự!";
    case "auth/invalid-email":
      return "Định dạng Email không hợp lệ!";
    case "auth/popup-closed-by-user":
      return "Cửa sổ đăng nhập Google đã bị đóng!";
    default:
      return "Có lỗi xảy ra: " + code;
  }
}
