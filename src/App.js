// src/App.js
import React, { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { SpeedInsights } from '@vercel/speed-insights/react';
import { FinancialYearProvider } from './pages/FinancialYearContext';
import { isAuthenticated } from './utils/auth';
import { isParishUser } from './utils/parishAuth';
import Main from "./components/layout/Main";
import ParishLayout from "./components/layout/ParishLayout";
import { Backdrop, CircularProgress, Typography, ThemeProvider, createTheme } from '@mui/material';

// Auth Pages
import LoginPage from './pages/LoginPage';
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ParishLoginPage from './pages/ParishLoginPage';

// Core Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";

// Organization Pages
import Forane from "./pages/Forane";
import Parish from "./pages/Parish";
import ParishCredentials from './pages/ParishCredentials';
import Koottayma from "./pages/SectionManagementPage";
import Family from "./pages/EventForm";
import Student from "./pages/StudentDetailsForm";

// Finance Pages
import PersonManagement from "./pages/CategoryPage";
import FamilyFinanace from "./pages/FamilyFinanace";
import FamilyNew from "./pages/ManagerForm";
import FamilyNew1 from "./pages/FamilyNew1";
import TransactionPage from "./pages/EventRegistration";
import TransactionListPage from './pages/TransactionListPage';
import Titheprint from "./pages/Titheprint";

// Settings Pages
import FinanceSettings from "./pages/VenueRegistration";
import CommunitySettings from "./pages/StageAllocation";
import OtherProjectSettings from "./pages/otherprojectsettings";
import ParishAllocSettings from "./pages/ParishallocSettings";
import ParishAllocSettings1 from "./pages/ParishallocSettings1";

// Other Pages
import MoveFamily from "./pages/movefamily";
import Community from "./pages/StageAllocation";
import Project from "./pages/EventScoringPage";
import EventScoring from "./pages/Eventscoringsimple";
import ChurchReportPage from './pages/EventRegistrationPrintPage';
import BulkFamilyPrintPage from './pages/JudgeMarkEntrySheet';
import OpeningBalance from './pages/ForaneEventRegistration';
import YearEndTransfer from './pages/JudgeMarkEntrySheetTotal';
import logout from './pages/logout';
import RegistrationNumberAssignment from './pages/RegistrationNumberAssignment';
import ParticipantList from './pages/ParticipantList';
import ResultsDashboard from './pages/ResultsDashboard';
import ResultsDashboardPro from './pages/ResultsDashboardPro';

// Styles
import "antd/dist/antd.css";
import "./assets/styles/main.css";
import "./assets/styles/responsive.css";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#047857' }
  }
});

const LoadingOverlay = () => (
  <Backdrop
    open={true}
    sx={{
      zIndex: theme => theme.zIndex.drawer + 1,
      color: '#fff',
      flexDirection: 'column',
      backgroundColor: 'rgba(0, 0, 0, 0.7)'
    }}
  >
    <CircularProgress color="inherit" size={60} />
    <Typography variant="h6" sx={{ mt: 2 }}>Loading...</Typography>
  </Backdrop>
);

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ThemeProvider theme={theme}>
      <FinancialYearProvider>
        <div className="App">
          <Switch>
            {/* Public pages */}
            <Route exact path="/" component={ResultsDashboardPro} />
            <Route exact path="/resultsDashboardPro" component={ResultsDashboardPro} />

            {/* Auth routes */}
            <Route exact path="/centerflogin">
              {isAuthenticated() ? <Redirect to="/home" /> : 
               isParishUser() ? <Redirect to="/parish/registration" /> : <ParishLoginPage />}
            </Route>
            <Route exact path="/parishlogin">
              {isParishUser() ? <Redirect to="/parish/registration" /> : <ParishLoginPage />}
            </Route>
            <Route exact path="/sign-up" component={SignUp} />
            <Route exact path="/sign-in" component={SignIn} />

            {/* ====== PARISH USER ROUTES ====== */}
            {isParishUser() && (
              <ParishLayout>
                <Switch>
                  {/* <Route exact path="/parish/registration" component={TransactionPage} />
                  <Route exact path="/parish/managers" component={FamilyNew} />  */}
                 
<Route exact path="/parish/participantList" component={ParticipantList} />
                  <Route exact path="/parish/print" component={ChurchReportPage} />
                  <Route path="*">
                    <Redirect to="/parish/registration" />
                  </Route>
                </Switch>
              </ParishLayout>
            )}

            {/* ====== ADMIN USER ROUTES ====== */}
            {isAuthenticated() ? (
              <Main>
                <Switch>
                  <Route exact path="/home" component={Home} />
                  <Route exact path="/dashboard" component={Home} />
                  <Route exact path="/profile" component={Profile} />
                  <Route exact path="/forane" component={Forane} />
                  <Route exact path="/parish" component={Parish} />
                  <Route exact path="/koottayma" component={Koottayma} />
                  <Route exact path="/Family" component={Family} />
                  <Route exact path="/Student" component={Student} />
                  <Route exact path="/PersonManagement" component={PersonManagement} />
                  <Route exact path="/FamilyFinanace" component={FamilyFinanace} />
                  <Route exact path="/FamilyFinance" component={FamilyNew} />
                  <Route exact path="/FamilyFinance1" component={FamilyNew1} />
                  <Route exact path="/transactions/new" component={TransactionListPage} />
                  <Route exact path="/transactions" component={TransactionPage} />
                  <Route exact path="/Titheprint" component={Titheprint} />
                  <Route exact path="/FinanceSettings" component={FinanceSettings} />
                  <Route exact path="/communitysettings" component={CommunitySettings} />
                  <Route exact path="/otherprojectsettings" component={OtherProjectSettings} />
                  <Route exact path="/parishallocsettings" component={ParishAllocSettings} />
                  <Route exact path="/parishallocsettings1" component={ParishAllocSettings1} />
                  <Route exact path="/registration-numbers" component={RegistrationNumberAssignment} />
                  <Route exact path="/participantList" component={ParticipantList} />
                  <Route exact path="/resultsDashboard" component={ResultsDashboard} />
                  <Route exact path="/parish-credentials" component={ParishCredentials} />
                  <Route exact path="/movefamily" component={MoveFamily} />
                  <Route exact path="/community" component={Community} />
                  <Route exact path="/project" component={Project} />
                  <Route exact path="/eventscoring" component={EventScoring} />
                  <Route exact path="/report" component={ChurchReportPage} />
                  <Route exact path="/family-print" component={BulkFamilyPrintPage} />
                  <Route exact path="/print-family/:id" component={BulkFamilyPrintPage} />
                  <Route exact path="/addopening" component={OpeningBalance} />
                  <Route exact path="/yearendtransfer" component={YearEndTransfer} />
                  <Route exact path="/logout" component={logout} />
                  <Route path="*"><Redirect to="/home" /></Route>
                </Switch>
              </Main>
            ) : (
              <Redirect to="/centerflogin" />
            )}
          </Switch>
          <SpeedInsights />
        </div>
      </FinancialYearProvider>
    </ThemeProvider>
  );
}

export default App;