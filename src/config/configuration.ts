export default () => {
    const majors: Record<string, { baseUrl: string; queryUrl: string }> = {};

    // 모든 학과 URL 가져오기
    for (const key of Object.keys(process.env)) {
        if (key.endsWith('_URL') && !['WHOLE', 'SWUNIV', 'INTERNATIONAL'].some(prefix => key.startsWith(prefix))) {
            // major는 대문자
            const major = key.replace('_URL', '');
            majors[major] = {
                baseUrl: process.env[key] || '',
                queryUrl: process.env[`${major}_QUERY_URL`] || '',
            };
        }
    }

    // 학과 스타일 (국제처, SW중심대학사업단)의 URL 가져오기
    const majorStyleNoticeTypes = ['INTERNATIONAL', 'SWUNIV'];

    const majorStyles: Record<string, { baseUrl: string; queryUrl: string }> = {};

    for (const type of majorStyleNoticeTypes) {
        majorStyles[type] = {
            baseUrl: process.env[`${type}_URL`] || '',
            queryUrl: process.env[`${type}_QUERY_URL`] || '',
        };
    }

    return {
        server: {
            port: process.env.PORT,
        },
        whole: {
            baseUrl: process.env.WHOLE_URL,
            queryUrl: process.env.WHOLE_QUERY_URL,
        },
        majors,
        majorStyles,
    };
};
