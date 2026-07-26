function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
  disabled = false,
  ...props
}) {
  const baseStyle =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",

    secondary: "border border-blue-600 text-blue-600 hover:bg-blue-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
