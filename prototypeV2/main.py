import json
import sys
import os

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from matching_engine import load_data, match_candidates_to_job
from feedback_loop import analyze_outcomes

def main():
    print("="*60)
    print("NEXT-GEN TALENT PLATFORM — PROTOTYPE V2")
    print("="*60)
    
    # Load hardcoded data
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = load_data(os.path.join(base_dir, 'data', 'candidates.json'))
    jobs = load_data(os.path.join(base_dir, 'data', 'jobs.json'))
    outcomes = load_data(os.path.join(base_dir, 'data', 'outcomes.json'))
    
    job = jobs[0]
    print(f"\n[1] TARGET JOB: {job['title']}")
    print(f"    Required Skills: {[s['name'] for s in job['required_skills']]}")
    
    print("\n[2] LAYER 1 & 2: SEMANTIC MATCHING + VERIFICATION")
    print("-" * 60)
    matches = match_candidates_to_job(candidates, job)
    
    for m in matches:
        print(f"Candidate: {m['candidate_name']}")
        print(f"  - Semantic Similarity : {m['semantic_similarity']}")
        print(f"  - Skill Coverage      : {m['skill_coverage']}")
        print(f"  - Verification Score  : {m['verification_score']}")
        print(f"  - Context Fit         : {m['context_fit']}")
        print(f"  => COMPOSITE SCORE    : {m['composite_score']}")
        print()
        
    print("[3] LAYER 3: POST-HIRE FEEDBACK LOOP & RETRAINING")
    print("-" * 60)
    # Inject mock historical scores into outcomes for the demo
    for o in outcomes:
        if o['candidate_id'] == 'c1':
            o['verification_score_at_hire'] = 0.85
        else:
            o['verification_score_at_hire'] = 0.30
            
    new_weights = analyze_outcomes(outcomes)
    
    print("\n[4] RE-RUNNING MATCH WITH RETRAINED WEIGHTS")
    print("-" * 60)
    print(f"New Weights: {new_weights}")
    retrained_matches = match_candidates_to_job(candidates, job, weights=new_weights)
    
    for m in retrained_matches:
        print(f"Candidate: {m['candidate_name']} => NEW COMPOSITE SCORE: {m['composite_score']}")

if __name__ == "__main__":
    main()