const TAG_STYLES = {
  urgent: 'bg-[#fbe7df] text-[#a04125] ring-[#f2cfc2]',
  'needs reply': 'bg-[#f8efd9] text-[#85611e] ring-[#eee0ba]',
  receipt: 'bg-[#e5f1e7] text-[#2f6849] ring-[#cfe5d4]',
  billing: 'bg-[#eaf1eb] text-[#4d6b55] ring-[#d9e6dc]',
  'payment due': 'bg-[#f9e2da] text-[#963b24] ring-[#efcabd]',
  invoices: 'bg-[#f3eade] text-[#7f6039] ring-[#e8dac8]',
  newsletter: 'bg-[#e9eef6] text-[#4c5e85] ring-[#dbe3ef]',
  subscription: 'bg-[#eef0e8] text-[#5a6650] ring-[#e1e4d8]',
  design: 'bg-[#f1e9f4] text-[#75517e] ring-[#e6d8eb]',
  contract: 'bg-[#ece9f5] text-[#5b5385] ring-[#ded8ed]',
  hiring: 'bg-[#e8eef6] text-[#4c6084] ring-[#dbe4ef]',
  product: 'bg-[#eaf1ef] text-[#436b63] ring-[#d7e5e0]',
  shipping: 'bg-[#e5eff3] text-[#3f6777] ring-[#d2e4eb]',
  culture: 'bg-[#f5e8e4] text-[#875642] ring-[#ecd7cf]',
  travel: 'bg-[#e5edf4] text-[#42617f] ring-[#d5e2ed]',
  fyi: 'bg-[#eeefe9] text-[#626a5d] ring-[#e1e3da]',
  team: 'bg-[#edeee8] text-[#5c675a] ring-[#e0e2d8]',
  sift: 'bg-[#e3ecd7] text-[#35583f] ring-[#d2e2c4]',
  guide: 'bg-[#f3edde] text-[#7a6434] ring-[#e9dfc8]',
  writing: 'bg-[#f3e9e6] text-[#815b4f] ring-[#ead8d2]',
};

export default function Tag({ children, className = '' }) {
  const tone = TAG_STYLES[String(children).toLowerCase()] ?? TAG_STYLES.fyi;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[5px] px-1.5 py-[3px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.07em] ring-1 ring-inset ${tone} ${className}`}
    >
      {children}
    </span>
  );
}
