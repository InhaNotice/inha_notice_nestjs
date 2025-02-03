export default () => {
    const majors: Record<string, { url: string; queryUrl: string }> = {};

    // 환경 변수에서 자동으로 학과 정보를 가져오기
    Object.keys(process.env).forEach((key) => {
        if (key.endsWith('_URL') && !key.startsWith('WHOLE')) {
            const majorName = key.replace('_URL', '').toLowerCase(); // 학과명을 소문자로 변환
            majors[majorName] = {
                url: process.env[key] || '',
                queryUrl: process.env[`${majorName.toUpperCase()}_QUERY_URL`] || '',
            };
        }
    });

    return {
        server: {
            port: process.env.PORT,
        },
        majors,
        whole: {
            baseUrl: process.env.WHOLE_URL,
            queryUrl: process.env.WHOLE_QUERY_URL,
        },
    };
};