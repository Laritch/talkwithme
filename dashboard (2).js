import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '../../components/common/Layout';

// Dynamically import the instructor dashboard micro-frontend
const InstructorDashboard = dynamic(
  () => import('../../micro-frontends/instructor-dashboard/Dashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-96">
        <div className="loader"></div>
      </div>
    ),
  }
);

const InstructorDashboardPage = () => {
  const router = useRouter();
  const user = useSelector(state => state.user);
  const isAuthenticated = user.isAuthenticated;
  const isInstructor = user.isInstructor;

  // Check if user is authenticated and is an instructor
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/instructor/dashboard');
    } else if (!isInstructor) {
      router.push('/access-denied');
    }
  }, [isAuthenticated, isInstructor, router]);

  if (!isAuthenticated || !isInstructor) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="loader"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Instructor Dashboard | EduPlatform</title>
        <meta name="description" content="Manage your courses, track your revenue, and engage with your students from your instructor dashboard." />
      </Head>

      <div className="py-6">
        <InstructorDashboard userId={user.profile?.id} />
      </div>
    </Layout>
  );
};

export default InstructorDashboardPage;
