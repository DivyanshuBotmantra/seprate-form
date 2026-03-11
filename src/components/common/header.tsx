interface PageHeaderProps {
  title: string;
}

const PageHeader = ({ title }: PageHeaderProps) => {
  return (
    <div className="px-3 pt-2">
      <h1 className="font-semibold text-xl">{title}</h1>
    </div>
  );
};

export default PageHeader;
