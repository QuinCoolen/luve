export const getServerSideProps = async () => {
  return {
    redirect: {
      destination: "/dashboard/bids",
      permanent: false,
    },
  };
};

export default function DashboardIndex() {
  return null;
}
