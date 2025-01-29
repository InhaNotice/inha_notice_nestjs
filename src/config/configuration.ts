export default () => ({
    server: {
        port: process.env.PORT,
    },
    major: {
        name: process.env.MAJOR,
        url: process.env.MAJOR_URL,
        query_url: process.env.MAJOR_QUERY_URL,
    }
});
