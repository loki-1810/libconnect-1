function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-12 text-center">
      <h2 className="text-4xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-4 text-slate-600">
        {subtitle}
      </p>
    </div>
  );
}

export default SectionHeading;