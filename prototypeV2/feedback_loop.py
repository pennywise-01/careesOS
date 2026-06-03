import json

def analyze_outcomes(outcomes):
    successful = [o for o in outcomes if o['label'] == 'successful']
    poor = [o for o in outcomes if o['label'] == 'poor']
    
    print(f"Total outcomes analyzed: {len(outcomes)}")
    print(f"Successful hires: {len(successful)}")
    print(f"Poor hires: {len(poor)}")
    
    # Mock retraining logic: if verification score is high in successful hires, increase its weight
    avg_ver_score_successful = sum(o.get('verification_score_at_hire', 0.8) for o in successful) / len(successful) if successful else 0
    avg_ver_score_poor = sum(o.get('verification_score_at_hire', 0.3) for o in poor) / len(poor) if poor else 0
    
    print(f"Avg verification score (successful): {avg_ver_score_successful:.2f}")
    print(f"Avg verification score (poor): {avg_ver_score_poor:.2f}")
    
    # Suggest weight adjustment
    if avg_ver_score_successful > avg_ver_score_poor + 0.2:
        print("=> RETRAINING INSIGHT: Verification score is highly predictive of success. Recommend increasing 'verification' weight in composite score.")
        return {'semantic': 0.35, 'skill_coverage': 0.20, 'verification': 0.30, 'context_fit': 0.15}
    
    return {'semantic': 0.40, 'skill_coverage': 0.25, 'verification': 0.20, 'context_fit': 0.15}