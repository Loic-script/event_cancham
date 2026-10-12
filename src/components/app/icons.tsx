import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function make(name: string, children: React.ReactNode) {
  function Icon(props: IconProps) {
    return (
      <svg {...base} {...props}>
        {children}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const HomeIcon = make("HomeIcon", <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>);
export const TicketIcon = make("TicketIcon", <><path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></>);
export const TrophyIcon = make("TrophyIcon", <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>);
export const GlobeIcon = make("GlobeIcon", <><path d="M18.9 14.4A8 8 0 1 1 15 6.1" /><ellipse cx="11" cy="13" rx="3.2" ry="8" /><path d="M3.4 11.2c2.4 1.6 12.8 1.6 15.2 0" /><rect x="15.6" y="3.6" width="2.6" height="2.6" rx=".5" fill="currentColor" stroke="none" /><rect x="19.2" y="5.6" width="2.6" height="2.6" rx=".5" fill="currentColor" stroke="none" /><rect x="17.6" y="7.8" width="1.8" height="1.8" rx=".4" fill="currentColor" stroke="none" /><rect x="21.2" y="2.4" width="1.8" height="1.8" rx=".4" fill="currentColor" stroke="none" /><rect x="20.6" y="9.4" width="1.8" height="1.8" rx=".4" fill="currentColor" stroke="none" /></>);
export const UsersIcon = make("UsersIcon", <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
export const MessageCircleIcon = make("MessageCircleIcon", <path fillRule="evenodd" fill="currentColor" stroke="none" d="M19.8 15.3A8.6 8.6 0 1 0 15.6 19.6L21.2 21.2ZM7.6 8.4h8.8a.9.9 0 0 1 0 1.8H7.6a.9.9 0 0 1 0-1.8Zm0 3h8.8a.9.9 0 0 1 0 1.8H7.6a.9.9 0 0 1 0-1.8Zm0 3h6a.9.9 0 0 1 0 1.8h-6a.9.9 0 0 1 0-1.8Z" />);
export const UserIcon = make("UserIcon", <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>);
export const SearchIcon = make("SearchIcon", <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>);
export const HeartIcon = make("HeartIcon", <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />);
export const CommentIcon = make("CommentIcon", <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);
export const SendIcon = make("SendIcon", <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
export const ArrowLeftIcon = make("ArrowLeftIcon", <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>);
export const ArrowRightIcon = make("ArrowRightIcon", <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>);
export const MoreIcon = make("MoreIcon", <><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /></>);
export const BellIcon = make("BellIcon", <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>);
export const SlidersIcon = make("SlidersIcon", <><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" /></>);
export const LogOutIcon = make("LogOutIcon", <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>);
export const ChevronRightIcon = make("ChevronRightIcon", <path d="m9 18 6-6-6-6" />);
export const ChevronLeftIcon = make("ChevronLeftIcon", <path d="m15 18-6-6 6-6" />);
export const MapPinIcon = make("MapPinIcon", <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>);
export const CalendarIcon = make("CalendarIcon", <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>);
export const ClockIcon = make("ClockIcon", <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>);
export const MaximizeIcon = make("MaximizeIcon", <><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></>);
export const DownloadIcon = make("DownloadIcon", <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>);
export const ShareIcon = make("ShareIcon", <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="m16 6-4-4-4 4" /><path d="M12 2v13" /></>);
export const CheckIcon = make("CheckIcon", <path d="M20 6 9 17l-5-5" />);
export const XIcon = make("XIcon", <><path d="M18 6 6 18" /><path d="M6 6l12 12" /></>);
export const PlusIcon = make("PlusIcon", <><path d="M5 12h14" /><path d="M12 5v14" /></>);
export const CameraIcon = make("CameraIcon", <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>);
export const PencilIcon = make("PencilIcon", <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />);
export const SunIcon = make("SunIcon", <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>);
export const SparklesIcon = make("SparklesIcon", <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z" />);
export const ImageIcon = make("ImageIcon", <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>);
export const PhoneIcon = make("PhoneIcon", <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />);
export const VideoIcon = make("VideoIcon", <><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></>);
export const InfoIcon = make("InfoIcon", <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>);
export const LinkIcon = make("LinkIcon", <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>);
export const QrIcon = make("QrIcon", <><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="16" y="3" width="5" height="5" rx="1" /><rect x="3" y="16" width="5" height="5" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></>);
export const WalletIcon = make("WalletIcon", <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></>);
export const FlameIcon = make("FlameIcon", <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />);
export const SmileIcon = make("SmileIcon", <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" /></>);
export const BriefcaseIcon = make("BriefcaseIcon", <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>);
export const ShieldCheckIcon = make("ShieldCheckIcon", <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>);
export const MicIcon = make("MicIcon", <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></>);
export const TrashIcon = make("TrashIcon", <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></>);
export const PlayIcon = make("PlayIcon", <path d="M7 4.5v15l12-7.5L7 4.5Z" fill="currentColor" stroke="none" />);
export const PauseIcon = make("PauseIcon", <><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" /></>);
export const LockIcon = make("LockIcon", <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>);
export const UploadIcon = make("UploadIcon", <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>);
export const FilmIcon = make("FilmIcon", <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18" /><path d="M17 3v18" /><path d="M3 12h18" /><path d="M3 7.5h4" /><path d="M3 16.5h4" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></>);
export const ExternalLinkIcon = make("ExternalLinkIcon", <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>);
export const GiftIcon = make("GiftIcon", <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></>);
export const SpinnerIcon = make("SpinnerIcon", <path d="M12 3a9 9 0 1 0 9 9" />);
export const FacebookIcon = make("FacebookIcon", <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />);
export const InstagramIcon = make("InstagramIcon", <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><path d="M17.5 6.5h.01" /></>);
export const LinkedinIcon = make("LinkedinIcon", <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>);
export const SparkIcon = make("SparkIcon", <><path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" /><path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 7.76 2.83-2.83" /></>);
export const MailIcon = make("MailIcon", <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>);
export const EyeIcon = make("EyeIcon", <><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOffIcon = make("EyeOffIcon", <><path d="M3 3l18 18" /><path d="M10.6 5.9A10.8 10.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.2 4" /><path d="M6.3 6.9A17 17 0 0 0 2.5 12s3.5 6.5 9.5 6.5c1.5 0 2.9-.4 4.1-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>);
export const MenuIcon = make("MenuIcon", <path d="M4 7h16M4 12h16M4 17h16" />);
export const MegaphoneIcon = make("MegaphoneIcon", <><path d="M4 10v4h3l6 4V6l-6 4z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" /></>);
export const ArmchairIcon = make("ArmchairIcon", <><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" /><path d="M3 13a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3z" /><path d="M6 19v2M18 19v2" /></>);
export const CartIcon = make("CartIcon", <><path d="M4 6h16l-1.5 9h-13z" /><path d="M4 6 3 3H1" /><path d="M8 20h.01M17 20h.01" /></>);
export const BookIcon = make("BookIcon", <><path d="M4 5h12v14H4z" /><path d="M16 10l5-3v10l-5-3" /></>);
export const FolderIcon = make("FolderIcon", <path d="M3 6h7l2 2h9v11H3z" />);
export const HeadsetIcon = make("HeadsetIcon", <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2z" /><path d="M20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z" /><path d="M17 17a4 4 0 0 1-4 3h-1" /></>);
export const ContactsIcon = make("ContactsIcon", <><path d="M5 3h14v18H5z" /><path d="M9 8h6M9 12h6M9 16h3" /></>);
export const CalendarCheckIcon = make("CalendarCheckIcon", <><path d="M4 5h16v16H4z" /><path d="M4 10h16M8 3v4M16 3v4" /><path d="m8.5 15.5 2.5 2.5 4.5-5" /></>);
export const CalendarDaysIcon = make("CalendarDaysIcon", <><path d="M4 5h16v16H4z" /><path d="M4 10h16M8 3v4M16 3v4" /><path d="M8 14h2M12 14h2M8 17h2" /></>);
export const NewspaperIcon = make("NewspaperIcon", <><path d="M4 5h13v14H6a2 2 0 0 1-2-2z" /><path d="M17 9h3v8a2 2 0 0 1-2 2" /><path d="M8 9h5M8 13h5" /></>);
export const LayoutIcon = make("LayoutIcon", <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10" /></>);
