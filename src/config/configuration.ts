/*
 * This is file of the project INGONG
 * Licensed under the MIT License.
 * Copyright (c) 2025 INGONG
 * For full license text, see the LICENSE file in the root directory or at
 * https://opensource.org/license/mit
 * Author: junho Kim
 * Latest Updated Date: 2025-03-24
 */

export default () => {
    return {
        server: {
            port: process.env.PORT,
        },
        wholes: {
            // 전체
            'all-notices': {
                baseUrl: process.env.WHOLE_URL,
                queryUrl: process.env.WHOLE_QUERY_URL,
            },
            // 장학
            SCHOLARSHIP: {
                baseUrl: process.env.SCHOLARSHIP_URL,
                queryUrl: process.env.SCHOLARSHIP_QUERY_URL,
            },
            // 모집/채용
            RECRUITMENT: {
                baseUrl: process.env.RECRUITMENT_URL,
                queryUrl: process.env.RECRUITMENT_QUERY_URL,
            },
        },
        majors: {
            // 공과대학
            MECH: {
                baseUrl: process.env.MECH_URL,
                queryUrl: process.env.MECH_QUERY_URL,
            },
            AEROSPACE: {
                baseUrl: process.env.AEROSPACE_URL,
                queryUrl: process.env.AEROSPACE_QUERY_URL,
            },
            NAOE: {
                baseUrl: process.env.NAOE_URL,
                queryUrl: process.env.NAOE_QUERY_URL,
            },
            IE: {
                baseUrl: process.env.IE_URL,
                queryUrl: process.env.IE_QUERY_URL,
            },
            CHEMENG: {
                baseUrl: process.env.CHEMENG_URL,
                queryUrl: process.env.CHEMENG_QUERY_URL,
            },
            INHAPOLY: {
                baseUrl: process.env.INHAPOLY_URL,
                queryUrl: process.env.INHAPOLY_QUERY_URL,
            },
            DMSE: {
                baseUrl: process.env.DMSE_URL,
                queryUrl: process.env.DMSE_QUERY_URL,
            },
            CIVIL: {
                baseUrl: process.env.CIVIL_URL,
                queryUrl: process.env.CIVIL_QUERY_URL,
            },
            ENVIRONMENT: {
                baseUrl: process.env.ENVIRONMENT_URL,
                queryUrl: process.env.ENVIRONMENT_QUERY_URL,
            },
            GEOINFO: {
                baseUrl: process.env.GEOINFO_URL,
                queryUrl: process.env.GEOINFO_QUERY_URL,
            },
            ARCH: {
                baseUrl: process.env.ARCH_URL,
                queryUrl: process.env.ARCH_QUERY_URL,
            },
            ENERES: {
                baseUrl: process.env.ENERES_URL,
                queryUrl: process.env.ENERES_QUERY_URL,
            },
            ELECTRICAL: {
                baseUrl: process.env.ELECTRICAL_URL,
                queryUrl: process.env.ELECTRICAL_QUERY_URL,
            },
            EE: {
                baseUrl: process.env.EE_URL,
                queryUrl: process.env.EE_QUERY_URL,
            },
            ICE: {
                baseUrl: process.env.ICE_URL,
                queryUrl: process.env.ICE_QUERY_URL,
            },
            EEE: {
                baseUrl: process.env.EEE_URL,
                queryUrl: process.env.EEE_QUERY_URL,
            },
            SSE: {
                baseUrl: process.env.SSE_URL,
                queryUrl: process.env.SSE_QUERY_URL,
            },

            // 자연과학대학
            MATH: {
                baseUrl: process.env.MATH_URL,
                queryUrl: process.env.MATH_QUERY_URL,
            },
            STATISTICS: {
                baseUrl: process.env.STATISTICS_URL,
                queryUrl: process.env.STATISTICS_QUERY_URL,
            },
            PHYSICS: {
                baseUrl: process.env.PHYSICS_URL,
                queryUrl: process.env.PHYSICS_QUERY_URL,
            },
            CHEMISTRY: {
                baseUrl: process.env.CHEMISTRY_URL,
                queryUrl: process.env.CHEMISTRY_QUERY_URL,
            },
            FOODNUTRI: {
                baseUrl: process.env.FOODNUTRI_URL,
                queryUrl: process.env.FOODNUTRI_QUERY_URL,
            },
            // 해양과학과

            // 경영대학
            BIZ: {
                baseUrl: process.env.BIZ_URL,
                queryUrl: process.env.BIZ_QUERY_URL,
            },
            GFIBA: {
                baseUrl: process.env.GFIBA_URL,
                queryUrl: process.env.GFIBA_QUERY_URL,
            },
            APSL: {
                baseUrl: process.env.APSL_URL,
                queryUrl: process.env.APSL_QUERY_URL,
            },
            STAR: {
                baseUrl: process.env.STAR_URL,
                queryUrl: process.env.STAR_QUERY_URL,
            },

            // 사범대학
            KOREANEDU: {
                baseUrl: process.env.KOREANEDU_URL,
                queryUrl: process.env.KOREANEDU_QUERY_URL,
            },
            DELE: {
                baseUrl: process.env.DELE_URL,
                queryUrl: process.env.DELE_QUERY_URL,
            },
            SOCIALEDU: {
                baseUrl: process.env.SOCIALEDU_URL,
                queryUrl: process.env.SOCIALEDU_QUERY_URL,
            },
            PHYSICALEDU: {
                baseUrl: process.env.PHYSICALEDU_URL,
                queryUrl: process.env.PHYSICALEDU_QUERY_URL,
            },
            EDUCATION: {
                baseUrl: process.env.EDUCATION_URL,
                queryUrl: process.env.EDUCATION_QUERY_URL,
            },
            MATHED: {
                baseUrl: process.env.MATHED_URL,
                queryUrl: process.env.MATHED_QUERY_URL,
            },

            // 사회과학대학
            PUBLICAD: {
                baseUrl: process.env.PUBLICAD_URL,
                queryUrl: process.env.PUBLICAD_QUERY_URL,
            },
            POLITICAL: {
                baseUrl: process.env.POLITICAL_URL,
                queryUrl: process.env.POLITICAL_QUERY_URL,
            },
            COMM: {
                baseUrl: process.env.COMM_URL,
                queryUrl: process.env.COMM_QUERY_URL,
            },
            ECON: {
                baseUrl: process.env.ECON_URL,
                queryUrl: process.env.ECON_QUERY_URL,
            },
            CONSUMER: {
                baseUrl: process.env.CONSUMER_URL,
                queryUrl: process.env.CONSUMER_QUERY_URL,
            },
            CHILD: {
                baseUrl: process.env.CHILD_URL,
                queryUrl: process.env.CHILD_QUERY_URL,
            },
            WELFARE: {
                baseUrl: process.env.WELFARE_URL,
                queryUrl: process.env.WELFARE_QUERY_URL,
            },

            // 문과대학
            KOREAN: {
                baseUrl: process.env.KOREAN_URL,
                queryUrl: process.env.KOREAN_QUERY_URL,
            },
            HISTORY: {
                baseUrl: process.env.HISTORY_URL,
                queryUrl: process.env.HISTORY_QUERY_URL,
            },
            PHILOSOPHY: {
                baseUrl: process.env.PHILOSOPHY_URL,
                queryUrl: process.env.PHILOSOPHY_QUERY_URL,
            },
            CHINESE: {
                baseUrl: process.env.CHINESE_URL,
                queryUrl: process.env.CHINESE_QUERY_URL,
            },
            JAPAN: {
                baseUrl: process.env.JAPAN_URL,
                queryUrl: process.env.JAPAN_QUERY_URL,
            },
            ENGLISH: {
                baseUrl: process.env.ENGLISH_URL,
                queryUrl: process.env.ENGLISH_QUERY_URL,
            },
            FRANCE: {
                baseUrl: process.env.FRANCE_URL,
                queryUrl: process.env.FRANCE_QUERY_URL,
            },
            CULTURECM: {
                baseUrl: process.env.CULTURECM_URL,
                queryUrl: process.env.CULTURECM_QUERY_URL,
            },
            EES: {
                baseUrl: process.env.EES_URL,
                queryUrl: process.env.EES_QUERY_URL,
            },

            // 의과대학
            MEDICINE: {
                baseUrl: process.env.MEDICINE_URL,
                queryUrl: process.env.MEDICINE_QUERY_URL,
            },

            // 간호대학
            NURSING: {
                baseUrl: process.env.NURSING_URL,
                queryUrl: process.env.NURSING_QUERY_URL,
            },

            // 예술체육대학
            FINEARTS: {
                baseUrl: process.env.FINEARTS_URL,
                queryUrl: process.env.FINEARTS_QUERY_URL,
            },
            // 디자인융합학과 (마지막 페이지:16)
            SPORT: {
                baseUrl: process.env.SPORT_URL,
                queryUrl: process.env.SPORT_QUERY_URL,
            },
            THEATREFILM: {
                baseUrl: process.env.THEATREFILM_URL,
                queryUrl: process.env.THEATREFILM_QUERY_URL,
            },
            FASHION: {
                baseUrl: process.env.FASHION_URL,
                queryUrl: process.env.FASHION_QUERY_URL,
            },

            // 바이오시스템융합학부
            BIO: {
                baseUrl: process.env.BIO_URL,
                queryUrl: process.env.BIO_QUERY_URL,
            },
            BIOLOGY: {
                baseUrl: process.env.BIOLOGY_URL,
                queryUrl: process.env.BIOLOGY_QUERY_URL,
            },
            BIOPHARM: {
                baseUrl: process.env.BIOPHARM_URL,
                queryUrl: process.env.BIOPHARM_QUERY_URL,
            },
            BIOMEDICAL: {
                baseUrl: process.env.BIOMEDICAL_URL,
                queryUrl: process.env.BIOMEDICAL_QUERY_URL,
            },

            // 국제학부
            SGCSA: {
                baseUrl: process.env.SGCSA_URL,
                queryUrl: process.env.SGCSA_QUERY_URL,
            },
            SGCSB: {
                baseUrl: process.env.SGCSB_URL,
                queryUrl: process.env.SGCSB_QUERY_URL,
            },
            SGCSC: {
                baseUrl: process.env.SGCSC_URL,
                queryUrl: process.env.SGCSC_QUERY_URL,
            },

            // 미래융합대학
            FCCOLLEGEA: {
                baseUrl: process.env.FCCOLLEGEA_URL,
                queryUrl: process.env.FCCOLLEGEA_QUERY_URL,
            },
            FCCOLLEGEB: {
                baseUrl: process.env.FCCOLLEGEB_URL,
                queryUrl: process.env.FCCOLLEGEB_QUERY_URL,
            },
            FCCOLLEGEC: {
                baseUrl: process.env.FCCOLLEGEC_URL,
                queryUrl: process.env.FCCOLLEGEC_QUERY_URL,
            },
            FCCOLLEGED: {
                baseUrl: process.env.FCCOLLEGED_URL,
                queryUrl: process.env.FCCOLLEGED_QUERY_URL,
            },

            // 소프트웨어융합대학
            DOAI: {
                baseUrl: process.env.DOAI_URL,
                queryUrl: process.env.DOAI_QUERY_URL,
            },
            SME: {
                baseUrl: process.env.SME_URL,
                queryUrl: process.env.SME_QUERY_URL,
            },
            DATASCIENCE: {
                baseUrl: process.env.DATASCIENCE_URL,
                queryUrl: process.env.DATASCIENCE_QUERY_URL,
            },
            DESIGNTECH: {
                baseUrl: process.env.DESIGNTECH_URL,
                queryUrl: process.env.DESIGNTECH_QUERY_URL,
            },
            CSE: {
                baseUrl: process.env.CSE_URL,
                queryUrl: process.env.CSE_QUERY_URL,
            },

            // 프런티어창의대학
            LAS: {
                baseUrl: process.env.LAS_URL,
                queryUrl: process.env.LAS_QUERY_URL,
            },
            ECS: {
                baseUrl: process.env.ECS_URL,
                queryUrl: process.env.ECS_QUERY_URL,
            },
            NCS: {
                baseUrl: process.env.NCS_URL,
                queryUrl: process.env.NCS_QUERY_URL,
            },
            CVGSOSCI: {
                baseUrl: process.env.CVGSOSCI_URL,
                queryUrl: process.env.CVGSOSCI_QUERY_URL,
            },
            CVGHUMAN: {
                baseUrl: process.env.CVGHUMAN_URL,
                queryUrl: process.env.CVGHUMAN_QUERY_URL,
            },
        },
        // 학과 스타일(국제처, SWUNIV, 단과대) URL 불러오기
        majorStyles: {
            // 국제처, SWUNIV
            INTERNATIONAL: {
                baseUrl: process.env.INTERNATIONAL_URL,
                queryUrl: process.env.INTERNATIONAL_QUERY_URL,
            },
            SWUNIV: {
                baseUrl: process.env.SWUNIV_URL,
                queryUrl: process.env.SWUNIV_QUERY_URL,
            },
            // 단과대
            ENGCOLLEAGE: {
                baseUrl: process.env.ENGCOLLEAGE_URL,
                queryUrl: process.env.ENGCOLLEAGE_QUERY_URL,
            },
            NSCOLLEAGE: {
                baseUrl: process.env.NSCOLLEAGE_URL,
                queryUrl: process.env.NSCOLLEAGE_QUERY_URL,
            },
            CBA: {
                baseUrl: process.env.CBA_URL,
                queryUrl: process.env.CBA_QUERY_URL,
            },
            EDCOLLEGE: {
                baseUrl: process.env.EDCOLLEGE_URL,
                queryUrl: process.env.EDCOLLEGE_QUERY_URL,
            },
            SSCOLLEGE: {
                baseUrl: process.env.SSCOLLEGE_URL,
                queryUrl: process.env.SSCOLLEGE_QUERY_URL,
            },
            HACOLLEGE: {
                baseUrl: process.env.HACOLLEGE_URL,
                queryUrl: process.env.HACOLLEGE_QUERY_URL,
            },
            ARTSPORTS: {
                baseUrl: process.env.ARTSPORTS_URL,
                queryUrl: process.env.ARTSPORTS_QUERY_URL,
            },
            SWCC: {
                baseUrl: process.env.SWCC_URL,
                queryUrl: process.env.SWCC_QUERY_URL,
            },
            GENERALEDU: {
                baseUrl: process.env.GENERALEDU_URL,
                queryUrl: process.env.GENERALEDU_QUERY_URL,
            },
            // 대학원
            GRAD: {
                baseUrl: process.env.GRAD_URL,
                queryUrl: process.env.GRAD_QUERY_URL,
            },
            ENGRAD: {
                baseUrl: process.env.ENGRAD_URL,
                queryUrl: process.env.ENGRAD_QUERY_URL,
            },
            MBA: {
                baseUrl: process.env.MBA_URL,
                queryUrl: process.env.MBA_QUERY_URL,
            },
            EDUGRAD: {
                baseUrl: process.env.EDUGRAD_URL,
                queryUrl: process.env.EDUGRAD_QUERY_URL,
            },
            ADMGRAD: {
                baseUrl: process.env.ADMGRAD_URL,
                queryUrl: process.env.ADMGRAD_QUERY_URL,
            },
            COUNSELGRAD: {
                baseUrl: process.env.COUNSELGRAD_URL,
                queryUrl: process.env.COUNSELGRAD_QUERY_URL,
            },
            GSPH: {
                baseUrl: process.env.GSPH_URL,
                queryUrl: process.env.GSPH_QUERY_URL,
            },
            ILS: {
                baseUrl: process.env.ILS_URL,
                queryUrl: process.env.ILS_QUERY_URL,
            },
            GSL: {
                baseUrl: process.env.GSL_URL,
                queryUrl: process.env.GSL_QUERY_URL,
            },
            IMIS: {
                baseUrl: process.env.IMIS_URL,
                queryUrl: process.env.IMIS_QUERY_URL,
            }
        },
        oceanographyStyles: {
            OCEANOGRAPHY: {
                baseUrl: process.env.OCEANOGRAPHY_URL,
                queryUrl: process.env.OCEANOGRAPHY_QUERY_URL,
            },
        },
        inhadesignStyles: {
            INHADESIGN: {
                baseUrl: process.env.INHADESIGN_URL,
                queryUrl: process.env.INHADESIGN_QUERY_URL,
            }
        }
    };
};
