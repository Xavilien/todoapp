import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

import {Box} from "@mui/material";
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        setLoading(true);
        const userData = {
            email: email,
            password: password
        };

        axios
            .post("https://us-central1-todoapp-bf921.cloudfunctions.net/api/login", userData)
            .then((response) => {
                console.log("Got here")
                console.log(response.data)
                localStorage.setItem("AuthToken", `Bearer ${response.data.token}`);
                setLoading(false);
                navigate("/");
            })
            .catch((error) => {
                setErrors(error.response.data);
                console.log(error);
                setLoading(false);
            });
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box sx={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
            }}>
                <Avatar sx={{
                    margin: 1,
                    background: "red"
                }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Login
                </Typography>
                <Box sx={{
                    width: "100%",
                    marginTop: 1
                }}>
                    <form noValidate>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            helperText={errors.email}
                            error={!!errors.email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            helperText={errors.password}
                            error={!!errors.password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{
                                marginTop: 2
                            }}
                            onClick={handleSubmit}
                            disabled={loading || !email || !password}
                        >
                            Sign In
                            {loading && <CircularProgress size={30} sx={{
                                position: "absolute"
                            }} />}
                        </Button>
                        <Grid container>
                            <Grid item>
                                <Link href={"signup"} variant="body2">
                                    {"Don't have an account? Sign Up"}
                                </Link>
                            </Grid>
                        </Grid>
                        {errors.general && (
                            <Typography variant="body2" sx={{
                                color: "red",
                                fonSize: "0.8rem",
                                marginTop: 2
                            }}>
                                {errors.general}
                            </Typography>
                        )}
                    </form>
                </Box>

            </Box>
        </Container>
    );
}