import styled from "@emotion/styled";
import { useJwtAuth } from "@lightsparkdev/react-wallet";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useJwtAuth();
  const [accountId, setAccountId] = useState("");
  const [jwt, setJwt] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    auth.isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        navigate("/");
      }
    });
  }, [auth, navigate]);

  const from = location.state?.from?.pathname || "/";

  function handleLogin() {
    auth.login(accountId, jwt).then(() => {
      // Send them back to the page they tried to visit when they were
      // redirected to the login page. Use { replace: true } so we don't create
      // another entry in the history stack for the login page.  This means that
      // when they get to the protected page and click the back button, they
      // won't end up back on the login page, which is also really nice for the
      // user experience.
      navigate(from, { replace: true });
    });
  }

  const generateDemoTokens = async () => {
    const { token: jwt } = await fetch(
      `https://us-central1-jwt-minter.cloudfunctions.net/getJwt?userId=${userName}&password=${password}`
    ).then((res) => res.json());
    await auth.login("Account:01857e8b-cc47-9af2-0000-eb2de1fdecce", jwt);
    navigate(from, { replace: true });
  };

  return (
    <Container>
      <Description>Log into your Lightspark account to continue</Description>
      <Label>
        <span>Account ID:</span>
        <input
          type="text"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        />
      </Label>
      <br />
      <Label style={{ marginBottom: "32px" }}>
        <span>JWT:</span>
        <input
          type="text"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
        />
      </Label>
      <Button primary onClick={handleLogin}>
        Login
      </Button>
      <Description>
        Alternatively, use our demo jwt server with a user name and password.
        <br />
        See js-sdk/packages/wallet-sdk/examples/jwt-server
      </Description>
      <Label>
        <span>User Name:</span>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </Label>
      <Label>
        <span>Password:</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Label>
      <Button primary onClick={generateDemoTokens}>
        Generate Demo Tokens
      </Button>
    </Container>
  );
};

const Label = styled.label`
  display: flex;
  flex-direction: row;
  font-size: 18px;
  margin-bottom: 16px;
  width: 100%;

  & > span {
    width: 150px;
    color: #666666;
  }

  & > input {
    margin-left: 8px;
    padding: 4px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    width: 100%;
  }
`;

const Description = styled.p`
  font-size: 24px;
  text-align: center;
  margin-bottom: 64px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto;
  height: 100vh;
`;

export default LoginPage;
