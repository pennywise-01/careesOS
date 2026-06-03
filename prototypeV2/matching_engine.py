import json
import math

def load_data(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def cosine_similarity(vec1, vec2):
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)

def calculate_skill_coverage(candidate_skills, required_skills):
    required_names = {s['name'].lower() for s in required_skills if s.get('non_negotiable')}
    candidate_names = {s['name'].lower() for s in candidate_skills}
    if not required_names:
        return 1.0
    matched = len(required_names.intersection(candidate_names))
    return matched / len(required_names)

def calculate_context_fit(candidate_context, job_context):
    score = 0.0
    matches = 0
    total = 0
    
    if 'preferred_pace' in candidate_context and 'pace' in job_context:
        total += 1
        if candidate_context['preferred_pace'] == job_context['pace']:
            matches += 1
            
    if 'autonomy_level' in candidate_context and 'autonomy_offered' in job_context:
        total += 1
        if candidate_context['autonomy_level'] == job_context['autonomy_offered']:
            matches += 1
            
    return matches / total if total > 0 else 0.5

def calculate_verification_score(candidate_skills):
    verified_scores = [s['verified_score'] for s in candidate_skills if s.get('verified') and s.get('verified_score') is not None]
    if not verified_scores:
        return 0.0
    return sum(verified_scores) / len(verified_scores)

def match_candidates_to_job(candidates, job, weights=None):
    if weights is None:
        weights = {'semantic': 0.40, 'skill_coverage': 0.25, 'verification': 0.20, 'context_fit': 0.15}
        
    matches = []
    for candidate in candidates:
        semantic_sim = cosine_similarity(candidate['embedding_mock'], job['embedding_mock'])
        skill_cov = calculate_skill_coverage(candidate['skills'], job['required_skills'])
        ver_score = calculate_verification_score(candidate['skills'])
        ctx_fit = calculate_context_fit(candidate['work_context'], job['team_context'])
        
        composite = (
            semantic_sim * weights['semantic'] +
            skill_cov * weights['skill_coverage'] +
            ver_score * weights['verification'] +
            ctx_fit * weights['context_fit']
        )
        
        matches.append({
            'candidate_id': candidate['id'],
            'candidate_name': candidate['name'],
            'semantic_similarity': round(semantic_sim, 3),
            'skill_coverage': round(skill_cov, 3),
            'verification_score': round(ver_score, 3),
            'context_fit': round(ctx_fit, 3),
            'composite_score': round(composite, 3)
        })
        
    return sorted(matches, key=lambda x: x['composite_score'], reverse=True)