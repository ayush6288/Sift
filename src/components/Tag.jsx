const TAG_STYLES = {
  urgent:
    'bg-[#fbe7df] text-[#a04125] ring-[#f2cfc2] dark:bg-[#3a211b] dark:text-[#f2b4a2] dark:ring-[#5c352b]',
  'needs reply':
    'bg-[#f8efd9] text-[#85611e] ring-[#eee0ba] dark:bg-[#332a18] dark:text-[#ecd298] dark:ring-[#514226]',
  receipt:
    'bg-[#e5f1e7] text-[#2f6849] ring-[#cfe5d4] dark:bg-[#183023] dark:text-[#a9d3b5] dark:ring-[#2c4a37]',
  billing:
    'bg-[#eaf1eb] text-[#4d6b55] ring-[#d9e6dc] dark:bg-[#1a2b21] dark:text-[#b4cbb9] dark:ring-[#304538]',
  'payment due':
    'bg-[#f9e2da] text-[#963b24] ring-[#efcabd] dark:bg-[#3a211b] dark:text-[#f2b4a2] dark:ring-[#5c352b]',
  invoices:
    'bg-[#f3eade] text-[#7f6039] ring-[#e8dac8] dark:bg-[#2f291d] dark:text-[#d8c39f] dark:ring-[#4a402d]',
  newsletter:
    'bg-[#e9eef6] text-[#4c5e85] ring-[#dbe3ef] dark:bg-[#202a3b] dark:text-[#b2c2e1] dark:ring-[#34415a]',
  subscription:
    'bg-[#eef0e8] text-[#5a6650] ring-[#e1e4d8] dark:bg-[#252b22] dark:text-[#c3cdb5] dark:ring-[#3a4432]',
  design:
    'bg-[#f1e9f4] text-[#75517e] ring-[#e6d8eb] dark:bg-[#2d2431] dark:text-[#d4b8dc] dark:ring-[#46384c]',
  contract:
    'bg-[#ece9f5] text-[#5b5385] ring-[#ded8ed] dark:bg-[#282438] dark:text-[#c5bce6] dark:ring-[#3e3854]',
  hiring:
    'bg-[#e8eef6] text-[#4c6084] ring-[#dbe4ef] dark:bg-[#202a3b] dark:text-[#b6c7e5] dark:ring-[#34425a]',
  product:
    'bg-[#eaf1ef] text-[#436b63] ring-[#d7e5e0] dark:bg-[#1e302c] dark:text-[#b3d6c9] dark:ring-[#304a42]',
  shipping:
    'bg-[#e5eff3] text-[#3f6777] ring-[#d2e4eb] dark:bg-[#1e2e36] dark:text-[#b2d6e2] dark:ring-[#314852]',
  culture:
    'bg-[#f5e8e4] text-[#875642] ring-[#ecd7cf] dark:bg-[#32251f] dark:text-[#e0b9a6] dark:ring-[#4a3830]',
  travel:
    'bg-[#e5edf4] text-[#42617f] ring-[#d5e2ed] dark:bg-[#1e2b3a] dark:text-[#b5cde8] dark:ring-[#314156]',
  fyi: 'bg-[#eeefe9] text-[#626a5d] ring-[#e1e3da] dark:bg-[#262a23] dark:text-[#c5cbbd] dark:ring-[#3a4034]',
  team: 'bg-[#edeee8] text-[#5c675a] ring-[#e0e2d8] dark:bg-[#262a23] dark:text-[#c5cbbd] dark:ring-[#3a4034]',
  sift: 'bg-[#e3ecd7] text-[#35583f] ring-[#d2e2c4] dark:bg-[#1e3325] dark:text-[#c3dfb9] dark:ring-[#344b38]',
  guide:
    'bg-[#f3edde] text-[#7a6434] ring-[#e9dfc8] dark:bg-[#2f2a1e] dark:text-[#dfcc9f] dark:ring-[#4a422e]',
  writing:
    'bg-[#f3e9e6] text-[#815b4f] ring-[#ead8d2] dark:bg-[#30241f] dark:text-[#dab9ad] dark:ring-[#4a3730]',
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
