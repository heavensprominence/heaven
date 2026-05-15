import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthInit = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            localStorage.setItem('token', token);
            params.delete('token');
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
            window.history.replaceState({}, '', newUrl);
            window.dispatchEvent(new Event('storage'));
            navigate('/', { replace: true });
        }
    }, [navigate]);
    return null;
};
export default AuthInit;
